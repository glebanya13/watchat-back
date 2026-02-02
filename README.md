# 💬 WatChat Backend
This project is a comprehensive real-time communication platform built using NestJS, providing features such as authentication, group management, and real-time messaging. The platform is designed to be scalable, secure, and easy to use, making it an ideal solution for various applications, including social media, gaming, and collaboration tools.

## 🚀 Features
- **Authentication**: Secure authentication using JWT tokens and Passport.js
- **Group Management**: Create, read, update, and delete groups, as well as manage group members
- **Real-Time Messaging**: Real-time messaging using WebSockets and Socket.io
- **Call Management**: Create, read, update, and delete calls, as well as manage call participants
- **API Documentation**: API documentation using Swagger

## 🛠️ Tech Stack
- **Backend Framework**: NestJS
- **Database**: TypeORM with PostgreSQL
- **Authentication**: Passport.js with JWT tokens
- **Real-Time Messaging**: Socket.io with WebSockets
- **API Documentation**: Swagger
- **Build Tool**: npm

## 📦 Installation
To install the project, follow these steps:
1. Clone the repository using `git clone`
2. Install dependencies using `npm install`
3. Create a PostgreSQL database and update the database configuration in `src/config/database.config.ts`
4. Run the migrations using `npm run migrate`
5. Start the application using `npm run start`

## 💻 Usage
To use the application, follow these steps:
1. Start the application using `npm run start`
2. Open a web browser and navigate to `http://localhost:3000`
3. Use the API documentation to explore the available endpoints and features

## 📂 Project Structure
```markdown
src
├── app.module.ts
├── app.controller.ts
├── app.service.ts
├── auth
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── ...
├── gateway
│   ├── gateway.module.ts
│   ├── chat.gateway.ts
│   └── ...
├── groups
│   ├── groups.module.ts
│   ├── groups.controller.ts
│   ├── groups.service.ts
│   └── ...
├── calls
│   ├── calls.module.ts
│   ├── calls.controller.ts
│   ├── calls.service.ts
│   └── ...
├── config
│   ├── database.config.ts
│   └── ...
└── ...
```

## 🤝 Contributing
To contribute to the project, please follow these steps:
1. Fork the repository using `git fork`
2. Create a new branch using `git branch`
3. Make changes and commit them using `git commit`
4. Push the changes to the remote repository using `git push`
5. Create a pull request using the GitHub web interface

## 📝 License
The project is licensed under the MIT License.

## 📬 Contact
For any questions or concerns, please contact us at [glebanya.com@gmail.com](mailto:glebanya.com@gmail.com).
