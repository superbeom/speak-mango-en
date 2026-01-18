# Marketing Studio & Automation Guide

**최종 수정일**: 2026-01-18

이 문서는 SNS 마케팅을 위한 고화질 에셋을 생성하는 **Marketing Studio** 기능과, 이를 대량으로 자동화하는 **Python 스크립트**의 사용법을 다룹니다.

---

## 1. Marketing Studio (`/studio/[id]`)

### 개요 (Overview)

개발자 도구나 캡처 도구를 사용하지 않고, 브라우저에서 직접 고화질의 마케팅용 이미지를 생성하고 다운로드할 수 있는 숨겨진 페이지입니다.

### 주요 기능 (Features)

- **High Resolution**: Retina 디스플레이(2x) 기준으로 렌더링된 고화질 PNG 다운로드.
- **Customizable Backgrounds**:
  - **Mango (Default)**: 브랜드 그라데이션 (Orange-Yellow-Green).
  - **Solid/Gradient**: 다양한 단색 및 그라데이션 옵션 제공.
- **Aspect Ratios**:
  - **Square (1:1)**: 인스타그램 피드용.
  - **Story (9:16)**: 인스타그램 스토리, 틱톡, 쇼츠용.
- **Branding**: 하단 중앙에 Speak Mango 로고와 그라데이션 텍스트 워터마크 자동 삽입. 콘텐츠가 길어져도 로고와 겹치지 않도록 유동적인 레이아웃을 제공합니다.

### 접속 방법

브라우저 주소창에 직접 입력하여 접속합니다.

- URL 패턴: `/studio/[expression_id]`
- 예시: `http://localhost:3000/studio/1234-5678-uuid`

### 보안 (Security) 🔒

마케팅 스튜디오 경로는 **HTTP Basic Auth**로 보호됩니다. 접속 시 ID와 비밀번호를 입력해야 합니다.

- **설정 방법**: `.env.local` 파일에 다음 환경 변수를 설정합니다.
  ```env
  ADMIN_USER=your_id
  ADMIN_PASSWORD=your_password
  ```

---

## 2. Automated Image Generation (Batch Script)

사이트맵(`sitemap.xml`)에 등록된 모든 표현에 대해 스튜디오 이미지를 자동으로 캡처하여 저장하는 Python 스크립트입니다. 특정 언어를 지정하여 해당 언어의 번역이 적용된 이미지를 대량으로 생성할 수 있습니다.

### 사전 준비 (Prerequisites)

- **Python 3.x** 설치 필요.
- **Localhost Server**: Next.js 개발 서버가 `http://localhost:3000`에서 실행 중이어야 합니다.
- **Auth Credentials**: 스크립트가 Basic Auth를 통과할 수 있도록 `.env.local`의 설정과 스크립트 내 설정이 일치해야 합니다.

### 환경 설정 (Setup Guide)

프로젝트 루트에서 다음 명령어를 순서대로 실행하여 가상 환경을 구성합니다.

**1. 가상 환경(venv) 생성 및 활성화**

```bash
# 가상 환경 생성 (최초 1회)
python3 -m venv venv

# 가상 환경 활성화 (Mac/Linux)
source venv/bin/activate
```

**2. 필수 패키지 설치**

```bash
# pip 업그레이드
pip install --upgrade pip

# 라이브러리 설치 (requests, playwright)
pip install requests playwright

# Playwright 브라우저 바이너리 설치 (Chromium)
playwright install chromium
```

### 스크립트 실행 (Execution)

1. **Next.js 서버 실행** (별도 터미널):

   ```bash
   yarn dev
   ```

2. **파이썬 스크립트 실행** (venv가 활성화된 터미널):

   ```bash
   # 기본 언어(영어)로 생성 (studio_images/ 폴더에 저장)
   python scripts/generate_studio_images.py

   # 특정 언어 지정 생성 (studio_images/[lang]/ 폴더에 저장)
   # 예: 한국어 이미지 생성
   python scripts/generate_studio_images.py --lang ko
   ```

   **팁 (Custom URL)**: 만약 서버가 로컬이 아닌 특정 URL에서 실행 중이라면 환경 변수로 설정할 수 있습니다.

   ```bash
   export STUDIO_APP_URL="http://localhost:3001"
   python scripts/generate_studio_images.py --lang ko
   ```

### 동작 원리

1. `http://localhost:3000/sitemap.xml`을 파싱하여 모든 표현의 ID를 추출합니다.
2. `--lang` 인자가 있으면 `?lang=[code]` 쿼리 파라미터를 추가하여 페이지에 접속합니다.
3. Playwright(Headless Chrome)를 띄워 병렬(Concurrency: 3)로 `/studio/[id]` 페이지에 접속합니다.
4. `proxy.ts` 미들웨어가 `lang` 파라미터를 감지하여 적절한 언어 헤더(`x-locale`)를 설정합니다.
5. DOM 요소(`#studio-capture-area`)가 렌더링될 때까지 기다린 후 고해상도로 스크린샷을 찍습니다.
6. 결과물은 `studio_images/[lang]/[uuid].png` 경로에 저장됩니다.

---

## 3. 기술 구현 상세 (Technical Details)

### Frontend Structure

- **Directory**: `app/(admin)/studio/`
  - **Route Group**: `(admin)`과 같이 소괄호로 감싼 폴더는 **Route Group**이라 하며, URL 경로에는 영향을 주지 않고 프로젝트 구조를 정리하는 용도로 사용됩니다.
  - **URL**: 파일 경로는 `app/(admin)/studio`이지만, 실제 접속 URL은 `/admin`이 생략된 `/studio`로 유지됩니다.

  - **Purpose**: 마케팅 스튜디오 기능을 일반 사용자 페이지와 논리적으로 격리하여 관리하기 위함입니다.

- **Libraries**:
  - `html-to-image`: DOM 요소를 Canvas/PNG로 변환.
  - `file-saver`: 클라이언트 측 파일 다운로드 트리거.
- **Components**:
  - `ExpressionCard`: `isStatic` props를 추가하여 애니메이션을 끄고 레이아웃을 고정(`w-full`, `h-auto`)하여 정적 레이아웃을 제공합니다.
  - `StudioClient`: Flexbox 기반의 `flex-col` 레이아웃을 사용하여 콘텐츠 길이에 관계없이 브랜딩 로고가 하단에 적절히 위치하도록 보장합니다. (배경, 비율 선택 상태 관리 및 렌더링 담당)

### Middleware Security (`proxy.ts`)

Next.js의 `proxy.ts` (미들웨어)에서 `/studio` 경로의 Basic Auth 인증(`authorization` 헤더 검사)과 함께, 쿼리 파라미터 기반의 언어 감지 로직을 수행합니다.

### Backend/Script (`scripts/`)

- **Language**: Python.
- **Libraries**:
  - `requests`: XML 데이터 페칭 (auth 지원)
  - `playwright`: 브라우저 자동화
  - `device_scale_factor=2`: 고해상도 캡처
  - `asyncio`: 비동기 병렬 처리로 속도 최적화
  - `argparse`: `--lang` 옵션 지원
- **Auth**: `.env.local` 파일을 직접 파싱하여 인증 정보를 로드하므로 별도의 환경 변수 설정 없이도 실행 가능합니다.

### Git Configuration

다음 항목들은 `.gitignore`에 포함되어 저장소에 커밋되지 않습니다.

- `venv/`: 파이썬 가상 환경 폴더.
- `studio_images/`: 생성된 이미지 결과물 폴더.
- `__pycache__/`: 파이썬 캐시 파일.
