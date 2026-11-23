/**
 * 코어시크 회원가입·로그인 — 구글 시트 연동용 Apps Script
 *
 * 시트 구조 (users 시트, 1행은 제목)
 *   A: id   B: salt   C: hash   D: createdAt   E: lastLoginAt   F: nickname
 *
 * 비밀번호는 저장하지 않고, 무작위 salt를 붙여 SHA-256으로 바꾼 값(hash)만 저장합니다.
 * 설정 방법은 server/README.md를 보세요.
 */

const SHEET_NAME = 'users';
const ID_RULE = /^[a-z0-9_]{4,20}$/;
const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,32}$/;
const NICK_RULE = /^[가-힣A-Za-z0-9_]{2,10}$/;   // 화면에 보여 줄 닉네임 (실명 대신 별명)

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);   // 두 사람이 동시에 같은 아이디로 가입하는 것 방지
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const id = String(body.id || '').trim().toLowerCase();
    const pw = String(body.pw || '');
    if (!ID_RULE.test(id)) return reply({ ok: false, msg: '아이디는 영문 소문자, 숫자, 밑줄로 4~20자예요.' });

    const sheet = getSheet();
    const found = findUser(sheet, id);

    if (body.action === 'signup') {
      if (!PW_RULE.test(pw)) return reply({ ok: false, msg: '비밀번호는 영문과 숫자를 섞어 8자 이상이에요.' });
      if (found) return reply({ ok: false, msg: '이미 쓰고 있는 아이디예요.' });
      const nick = String(body.nick || '').trim();
      if (!NICK_RULE.test(nick) || /\d{6,}/.test(nick)) return reply({ ok: false, msg: '닉네임은 한글, 영문, 숫자, 밑줄로 2~10자예요. 전화번호 같은 숫자는 쓸 수 없어요.' });
      const salt = Utilities.getUuid().replace(/-/g, '');
      sheet.appendRow([id, salt, sha256(salt + pw), new Date(), '', nick]);
      return reply({ ok: true, id: id, no: sheet.getLastRow() - 1, nick: nick });   // 화면에는 닉네임만 표시
    }

    if (body.action === 'login') {
      if (!found || sha256(found.salt + pw) !== found.hash) return reply({ ok: false, msg: '아이디나 비밀번호가 맞지 않아요.' });
      sheet.getRange(found.row, 5).setValue(new Date());
      return reply({ ok: true, id: id, no: found.row - 1, nick: found.nick });
    }

    return reply({ ok: false, msg: '알 수 없는 요청이에요.' });
  } catch (err) {
    return reply({ ok: false, msg: '서버에서 문제가 생겼어요.' });
  } finally {
    lock.releaseLock();
  }
}

/* 주소를 브라우저로 열었을 때 연결 확인용 */
function doGet() {
  return reply({ ok: true, msg: '코어시크 계정 서버가 동작 중이에요.' });
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'salt', 'hash', 'createdAt', 'lastLoginAt', 'nickname']);
  }
  return sheet;
}

function findUser(sheet, id) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) return { row: i + 1, salt: String(rows[i][1]), hash: String(rows[i][2]), nick: String(rows[i][5] || '') };
  }
  return null;
}

function sha256(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
