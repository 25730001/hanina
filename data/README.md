# 데이터 출처·구분표 (data/exercises.json)

## 1. 대상과 출처

| 항목 | 내용 |
|---|---|
| 파일 | `data/exercises.json` (운동 16건) |
| 사용 화면 | 홈 추천, 운동 탐색 목록, 운동 상세, 보관함 |
| 원본 데이터셋 | Free Exercise DB (yuhonas/free-exercise-db) |
| 제공자 | 개인 개발자가 공개한 오픈 데이터 (공공기관 자료 아님) |
| 원본 URL | https://github.com/yuhonas/free-exercise-db |
| 이용 조건 | Unlicense (퍼블릭 도메인) |
| 수집일 | 2026-10-19 (원본 dist/exercises.json 다운로드) |
| 데이터 기준일 | 미확인 (원본 저장소 갱신일 확인 필요) |
| 원본 전체 건수 / 사용 건수 | 876건 / 16건 |

## 2. 연결 방식

| 항목 | 내용 |
|---|---|
| 방식 | **저장 JSON 사용** (`meta.source: "json"`) |
| 외부 API | **API 미연동** (실행 중 외부 요청 없음, `meta.api` 없음) |
| API 실패 시 대체 | 해당 없음 |
| 현재 화면에서 사용하는 방식 | 같은 내용을 `js/app.js`에 내장해 사용 (JSON 파일 불러오기는 이후 주차에 연결) |

## 3. 실제·더미·가공 구분 (필드별, 16건 공통)

| 필드 | 구분 | 근거 / 변환 규칙 |
|---|---|---|
| `id` | 자체 부여 | 1~16 순번 (원본 id와 별개, 원본 id는 `meta.sourceId`) |
| `engName` | 실제 | 원본 `name` 그대로 (일부 표기 정리) |
| `name` | 실제(가공) | 원본 `name`을 AI가 한국어로 번역 |
| `category` | 실제(가공) | 원본 `primaryMuscles` 변환: chest→가슴, lats·middle back→등, quadriceps→하체, shoulders→어깨 |
| `difficulty` | 실제(가공) | 원본 `level` 변환: beginner→초급, intermediate→중급 |
| `equipment` | 실제(가공) | 원본 `equipment` 변환: body only→맨몸, machine·cable→머신, dumbbell→덤벨, barbell→바벨 |
| `image` | 실제 | 원본 `images[0]`을 `asset/`에 저장 (파일명만 영문 소문자로 변경) |
| `steps` | 실제(가공) | 원본 `instructions`를 AI가 한국어로 번역·요약 |
| `description` | **더미** | AI가 작성한 설명 (원본에 없음) |
| `setup` | **더미** | AI가 작성한 기구 설정 방법 (원본에 없음) |
| `tips` | **더미** | AI가 작성한 초보자 주의사항 (원본에 없음) |

| 분류 | 필드 수 | 건수 |
|---|---|---|
| 실제 (가공 포함) | 7개 (`name`, `engName`, `category`, `difficulty`, `equipment`, `image`, `steps`) | 16건 전체 |
| 더미 | 3개 (`description`, `setup`, `tips`) | 16건 전체 |

## 4. ID별 원본 출처

| id | 원본 id (`meta.sourceId`) | id | 원본 id (`meta.sourceId`) |
|---|---|---|---|
| 1 | Pushups | 9 | Bodyweight_Squat |
| 2 | Dumbbell_Bench_Press | 10 | Barbell_Squat |
| 3 | Machine_Bench_Press | 11 | Leg_Press |
| 4 | Barbell_Bench_Press_-_Medium_Grip | 12 | Dumbbell_Lunges |
| 5 | Wide-Grip_Lat_Pulldown | 13 | Side_Lateral_Raise |
| 6 | Seated_Cable_Rows | 14 | Dumbbell_Shoulder_Press |
| 7 | Bent_Over_Barbell_Row | 15 | Barbell_Shoulder_Press |
| 8 | One-Arm_Dumbbell_Row | 16 | Front_Dumbbell_Raise |

## 5. 한계와 화면 안내

- `description`, `setup`, `tips`는 AI가 작성한 **더미 값**이며 전문가 검수를 거치지 않았습니다.
- 번역(`name`, `steps`)은 AI가 수행했고 원문과 완전히 같지 않을 수 있습니다.
- 난이도는 원본 데이터의 기준이며 별도로 검증하지 않았습니다.
- 이미지는 원본 데이터셋의 이미지를 사용했고, 상업적 서비스로 쓰려면 이미지 사용 권리를 따로 확인해야 합니다.
- 화면 안내 문구 예시: "설명·기구 설정·주의사항은 실습용 AI 작성 내용입니다."
- 최종 확인자: (기입) / 확인일: (기입)
