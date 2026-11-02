# 데이터 출처·구분표 (data/exercises.json)

## 1. 대상과 출처

| 항목 | 내용 |
|---|---|
| 파일 | `data/exercises.json` (운동 300건) |
| 사용 화면 | 홈 추천, 운동 탐색 목록, 운동 상세, 보관함 |
| 원본 데이터셋 | Free Exercise DB (yuhonas/free-exercise-db) |
| 제공자 | 개인 개발자가 공개한 오픈 데이터 (공공기관 자료 아님) |
| 원본 URL | https://github.com/yuhonas/free-exercise-db |
| 이용 조건 | Unlicense (퍼블릭 도메인) |
| 수집일 | 2026-10-19 (원본 dist/exercises.json 다운로드) |
| 데이터 기준일 | 미확인 (원본 저장소 갱신일 확인 필요) |
| 원본 전체 건수 / 사용 건수 | 876건 / 300건 |

## 2. 연결 방식

| 항목 | 내용 |
|---|---|
| 방식 | **저장 JSON 사용** (`meta.source: "json"`), 화면에 `JSON` 칩 표시 |
| 외부 API | **API 미연동** (`meta.api` 없음) |
| JSON 호출 위치 | `js/app.js`의 `loadData()`가 `./data/exercises.json`을 `fetch`로 불러옴 |
| 불러오기 실패 시 | 화면에 안내 문구와 `다시 시도` 버튼 표시 (파일을 더블클릭해서 열면 실패하므로 GitHub Pages 주소에서 확인) |
| 이미지 | 300건 모두 `asset/` 폴더 파일 사용 (1~16번은 직접 고른 이미지, 17~300번은 원본 저장소 `exercises/<sourceId>/0.jpg`를 받아 `번호-이름.jpg`로 저장) |

## 3. 선정 기준과 난이도 등급

| 항목 | 내용 |
|---|---|
| 선정 대상 | 원본 876건 중 근력 운동(strength), 난이도 초급·중급, 기구 맨몸·머신·케이블·덤벨·바벨 |
| 제외 | 고급(expert), 스트레칭·유산소·플라이오메트릭 등 다른 유형, 기타 기구 |
| 부위 | 6개 부위 × 각 50건 = 300건 (가슴·등·하체·어깨·팔·복근) |
| 난이도 등급 | **초급** = 원본 beginner, **중급** = 원본 intermediate (원본 기준을 그대로 변환, 별도 검증 없음) |
| 선정 순서 | 직접 고른 16건 우선 → 여러 관절을 쓰는 복합 운동 우선 → 기구가 고르게 섞이도록 선택 |

| 구분 | 건수 |
|---|---|
| 부위별 | 가슴 50 · 등 50 · 하체 50 · 어깨 50 · 팔 50 · 복근 50 |
| 난이도별 | 초급 219 · 중급 81 |
| 기구별 | 맨몸 60 · 머신 109 · 덤벨 63 · 바벨 68 |

## 4. 실제·더미·가공 구분 (필드별)

| 필드 | 구분 | 근거 / 변환 규칙 |
|---|---|---|
| `id` | 자체 부여 | 1~300 순번 (원본 id는 `meta.sourceId`) |
| `engName` | 실제 | 원본 `name` 그대로 |
| `name` | 실제(가공) | 원본 `name`의 단어를 한국어로 옮김 (1~16번은 직접 번역, 17~300번은 단어 사전으로 자동 변환한 뒤 어색한 이름 93건을 다듬음) |
| `category` | 실제(가공) | 원본 `primaryMuscles` 변환: chest→가슴, lats·middle back·lower back·traps→등, quadriceps·hamstrings·glutes·calves·abductors·adductors→하체, shoulders→어깨, biceps·triceps·forearms→팔, abdominals→복근 |
| `difficulty` | 실제(가공) | beginner→초급, intermediate→중급 |
| `equipment` | 실제(가공) | body only→맨몸, machine·cable→머신, dumbbell→덤벨, barbell→바벨 |
| `image` | 실제 | 원본 `images[0]` |
| `steps` | 실제(가공) | 1~16번: 한국어 번역·요약 / 17~300번: 영문 원문을 **한국어로 번역** (단계 수·내용 유지, 단위는 cm·kg로 환산, `meta.stepsLang: "ko"`) |
| `description`, `setup`, `tips` | 1~16번 **더미** / 17~300번 **정보 없음(null)** | 1~16번은 AI가 작성, 17~300번은 원본에 없고 작성하지 않아 비워 둠 (`meta.unknown`) |

| 대상 | 실제(가공 포함) 필드 | 더미 필드 | 정보 없음 필드 |
|---|---|---|---|
| 1~16번 (16건) | 7개 | 3개 | 0개 |
| 17~300번 (284건) | 7개 | 0개 | 3개 |

## 5. ID별 원본 출처

17~300번은 각 항목의 `meta.sourceId`에 원본 id가 기록되어 있습니다. 1~16번은 아래와 같습니다.

| id | 원본 id (`meta.sourceId`) |
|---|---|
| 1 | Pushups |
| 2 | Dumbbell_Bench_Press |
| 3 | Machine_Bench_Press |
| 4 | Barbell_Bench_Press_-_Medium_Grip |
| 5 | Wide-Grip_Lat_Pulldown |
| 6 | Seated_Cable_Rows |
| 7 | Bent_Over_Barbell_Row |
| 8 | One-Arm_Dumbbell_Row |
| 9 | Bodyweight_Squat |
| 10 | Barbell_Squat |
| 11 | Leg_Press |
| 12 | Dumbbell_Lunges |
| 13 | Side_Lateral_Raise |
| 14 | Dumbbell_Shoulder_Press |
| 15 | Barbell_Shoulder_Press |
| 16 | Front_Dumbbell_Raise |

## 6. 한계와 화면 안내

- 1~16번의 `description`, `setup`, `tips`는 AI가 작성한 **더미 값**이며 전문가 검수를 거치지 않았습니다.
- 17~300번의 운동 방법은 영문 원문을 한국어로 옮긴 것이며, 별도 전문가 검수는 거치지 않았습니다.
- 난이도는 원본 데이터의 기준이며 별도로 검증하지 않았습니다.
- 이미지는 원본 데이터셋의 이미지이며, 상업적 서비스로 쓰려면 이미지 사용 권리를 따로 확인해야 합니다.
- 화면 안내: 햄버거 메뉴 하단과 상세 화면 하단에 출처·더미 안내 문구를 표시합니다.
- 최종 확인자: (기입) / 확인일: (기입)
