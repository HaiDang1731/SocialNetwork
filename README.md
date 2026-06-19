# 🌐 SocialNetwork — React + Spring Boot

Dự án mạng xã hội đơn giản sử dụng **React** (frontend) và **Spring Boot** (backend).

---

## ⚙️ Hướng dẫn cài đặt

### 1. Yêu cầu
- Java 17+
- Node.js 18+
- SQL Server (localhost:1433)
- Maven

### 2. Clone dự án
```bash
git clone <url-repo>
cd SocialNetwork_project_demo
```

### 3. Cấu hình Backend

```bash
cd backend/src/main/resources

# Copy file mẫu và điền thông tin của bạn vào
copy application.properties.example application.properties
```

Mở file `application.properties` vừa tạo và điền:
- `YOUR_DB_USERNAME` → tên đăng nhập SQL Server (vd: `sa`)
- `YOUR_DB_PASSWORD` → mật khẩu SQL Server
- `YOUR_GOOGLE_CLIENT_ID` + `YOUR_GOOGLE_CLIENT_SECRET` → lấy tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `YOUR_EMAIL@gmail.com` + `YOUR_GMAIL_APP_PASSWORD` → tạo App Password tại [Google Account](https://myaccount.google.com/apppasswords)

### 4. Chạy Backend

```bash
cd backend
mvnw.cmd spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### 5. Chạy Frontend

```bash
cd frontend
npm install
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## 📁 Cấu trúc dự án

```
SocialNetwork_project_demo/
├── backend/          # Spring Boot API
│   └── src/main/resources/
│       ├── application.properties.example  ← file mẫu (có trên GitHub)
│       └── application.properties          ← file thật (KHÔNG có trên GitHub)
├── frontend/         # React App
└── uploads/          # File upload người dùng (không commit)
```
