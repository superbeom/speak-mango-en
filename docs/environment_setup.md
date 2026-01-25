# 환경 변수 설정 가이드 (Environment Setup Guide)

이 문서는 Speak Mango 프로젝트의 환경 변수 설정 방법을 안내합니다.

---

## 1. 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```bash
touch .env.local
```

> [!IMPORTANT]
> `.env.local` 파일은 `.gitignore`에 포함되어 있으므로 Git에 커밋되지 않습니다. 민감한 정보(API Key, Secret 등)를 안전하게 관리할 수 있습니다.

---

## 2. 필수 환경 변수

`.env.local` 파일에 다음 변수를 추가합니다:

```bash
# ============================================
# NextAuth Configuration
# ============================================

# NextAuth Secret Key (아래 '3. AUTH_SECRET 생성' 참조)
AUTH_SECRET="your-generated-secret-here"

# Google OAuth Credentials (아래 '4. Google OAuth 설정' 참조)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ============================================
# Supabase Configuration (기존)
# ============================================

# Supabase URL (Public)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"

# Supabase Anonymous Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Supabase Service Role Key (Private - 서버 전용)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ============================================
# Google Analytics (선택사항)
# ============================================

# GA4 Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## 3. AUTH_SECRET 생성

NextAuth는 세션 암호화를 위해 강력한 비밀 키가 필요합니다.

### 방법 1: OpenSSL 사용 (권장)

터미널에서 다음 명령어를 실행합니다:

```bash
openssl rand -base64 32
```

**출력 예시**:

```
Xk7mP9qR2vN8wL3tY6uH1jF4sD5gA0bC9eT8iO7pK6m=
```

이 값을 복사하여 `.env.local`의 `AUTH_SECRET`에 붙여넣습니다.

### 방법 2: Node.js 사용

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 방법 3: 온라인 생성기

- https://generate-secret.vercel.app/32

> [!WARNING]
> 프로덕션 환경에서는 반드시 **새로운 비밀 키**를 생성하세요. 예시 값을 그대로 사용하지 마세요.

---

## 4. Google OAuth 설정

Google 로그인 기능을 사용하려면 Google Cloud Console에서 OAuth 2.0 클라이언트를 생성해야 합니다.

### 4.1. Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 기존 프로젝트 선택 또는 새 프로젝트 생성

### 4.2. OAuth 동의 화면 설정

1. 좌측 메뉴에서 **"APIs & Services"** → **"OAuth consent screen"** 선택
2. User Type 선택:
   - **External**: 누구나 로그인 가능 (권장)
   - Internal: Google Workspace 조직 내부만 가능
3. 앱 정보 입력:
   - **App name**: `Speak Mango`
   - **User support email**: 본인 이메일
   - **Developer contact information**: 본인 이메일
4. **Save and Continue** 클릭
5. Scopes 단계는 기본값 유지 (Skip)
6. Test users 추가 (개발 중에는 본인 이메일 추가)

### 4.3. OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴에서 **"APIs & Services"** → **"Credentials"** 선택
2. 상단의 **"+ CREATE CREDENTIALS"** 클릭
3. **"OAuth 2.0 Client ID"** 선택
4. Application type: **"Web application"** 선택
5. Name: `Speak Mango Web Client` (임의)
6. **Authorized redirect URIs** 추가:

   **로컬 개발 환경**:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

   **프로덕션 환경** (배포 후):

   ```
   https://yourdomain.com/api/auth/callback/google
   ```

   > [!TIP]
   > 여러 환경을 동시에 추가할 수 있습니다. 로컬과 프로덕션 URL을 모두 등록하세요.

7. **CREATE** 클릭

### 4.4. 클라이언트 ID 및 Secret 복사

생성 완료 후 팝업에서 다음 정보를 복사합니다:

- **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxx`

이 값들을 `.env.local` 파일에 붙여넣습니다:

```bash
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxx"
```

### 4.5. 추가 설정 (선택사항)

**앱 로고 추가**:

- OAuth consent screen에서 "App logo" 업로드 가능
- 권장 크기: 120x120px

**도메인 검증** (프로덕션):

- "Authorized domains"에 본인 도메인 추가
- 예: `speakmango.com`

### 4.6. 리디렉션 URI와 callbackUrl의 차이 (중요)

Google Cloud Console의 **'승인된 리디렉션 URI'**와 코드에서 사용하는 **`callbackUrl`**은 서로 다른 개념입니다.

1.  **Google Console 설정 (고정)**
    - **역할**: "구글이 로그인을 처리한 후, 내 사이트의 어떤 **'인증 처리 엔진'**으로 정보를 던져줄 것인가?"를 결정합니다.
    - **설정값**: `http://localhost:3000/api/auth/callback/google` (이건 NextAuth가 인증을 마무리하는 '공장' 같은 주소로 고정입니다.)
      - **로컬 개발용**: `http://localhost:3000/api/auth/callback/google`
      - **(나중에 배포 시)**: `https://사용자도메인.com/api/auth/callback/google`

2.  **NextAuth `signIn` 설정 (동적)**
    - **역할**: "인증 공장(`callback/google`)에서 작업이 다 끝난 후, 유저를 실제로 **어떤 페이지**로 보내줄 것인가?"를 결정합니다.
    - **방법**: 헤더의 로그인 버튼에서 `signIn` 함수를 호출할 때 현재 페이지의 주소를 넘겨주면 됩니다.

#### 코드 예시 (현재 페이지 유지 방식)

헤더 등 공통 컴포넌트에서 로그인 후 현재 위치를 유지하는 방법입니다.

```tsx
"use client";

import { signIn } from "next-auth/react";

export function AuthButton() {
  const handleLogin = () => {
    // window.location.href를 사용하여 로그인 후 현재 페이지로 돌아가도록 설정
    signIn("google", { callbackUrl: window.location.href });
  };

  return <button onClick={handleLogin}>Log in with Google</button>;
}
```

---

## 5. 환경 변수 검증

모든 환경 변수가 올바르게 설정되었는지 확인합니다.

### 5.1. 개발 서버 실행

```bash
yarn dev
```

### 5.2. 인증 테스트

브라우저에서 다음 URL 접속:

```
http://localhost:3000/api/auth/signin
```

**예상 결과**:

- Google 로그인 버튼이 표시됨
- 버튼 클릭 시 Google 로그인 페이지로 리다이렉트

**에러 발생 시 체크리스트**:

- [ ] `.env.local` 파일이 프로젝트 루트에 있는가?
- [ ] 모든 환경 변수가 올바르게 입력되었는가? (따옴표, 공백 확인)
- [ ] Google OAuth Redirect URI가 정확한가?
- [ ] 개발 서버를 재시작했는가? (환경 변수 변경 후 필수)

---

## 6. 프로덕션 배포 시 주의사항

### 6.1. Vercel 배포

Vercel Dashboard에서 환경 변수를 설정합니다:

1. 프로젝트 선택
2. **Settings** → **Environment Variables**
3. `.env.local`의 모든 변수를 추가
4. **Production**, **Preview**, **Development** 환경 선택

### 6.2. Google OAuth Redirect URI 업데이트

프로덕션 도메인을 Google Cloud Console의 Authorized redirect URIs에 추가:

```
https://yourdomain.com/api/auth/callback/google
```

### 6.3. AUTH_SECRET 재생성

보안을 위해 프로덕션 환경에서는 **새로운 AUTH_SECRET**을 생성하여 사용하세요.

---

## 7. 트러블슈팅

### 문제: "Invalid redirect URI"

**원인**: Google OAuth 설정의 Redirect URI가 현재 URL과 일치하지 않음

**해결**:

1. Google Cloud Console → Credentials 확인
2. Redirect URI에 현재 도메인이 정확히 등록되어 있는지 확인
3. 프로토콜(`http` vs `https`) 및 포트 번호 확인

### 문제: "Missing AUTH_SECRET"

**원인**: 환경 변수가 로드되지 않음

**해결**:

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 개발 서버 재시작 (`yarn dev`)
3. 변수명 오타 확인 (`AUTH_SECRET` 정확히 입력)

### 문제: 로그인 후 세션이 유지되지 않음

**원인**: Database 연결 또는 sessions 테이블 문제

**해결**:

1. Supabase 연결 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
2. `database/migrations/016_init_user_system.sql` 실행 확인
3. Supabase Dashboard에서 `sessions` 테이블 존재 확인

---

## 8. 참고 문서

- [NextAuth.js 공식 문서](https://authjs.dev)
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Supabase 환경 변수 설정](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
