# merit-demo-api

Demo repository for the [merit](https://github.com/ravindu-ranasinghe/merit) hackathon project.
It's a small task-tracking API used to show paid code review on real pull requests.

## Run

```sh
npm install
npm start          # http://localhost:3000
```

Requests are authenticated with a bearer token. The in-memory seed has two users:

| User  | Token         |
|-------|---------------|
| alice | `alice-token` |
| bob   | `bob-token`   |

```sh
curl -H 'authorization: Bearer alice-token' localhost:3000/projects
```

## Routes

| Method | Path                      | Notes                              |
|--------|---------------------------|------------------------------------|
| GET    | `/health`                 | public                             |
| GET    | `/projects`               | projects you own                   |
| POST   | `/projects`               | create a project                   |
| GET    | `/projects/:id`           | owner only                         |
| PATCH  | `/projects/:id`           | owner only; rename or archive      |
| GET    | `/projects/:id/tasks`     | owner only                         |
| POST   | `/projects/:id/tasks`     | owner only                         |
