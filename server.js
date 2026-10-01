import express from "express";
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send("Конференции.РФ"));
app.get('/about', (req, res) => res.send("О портале Конференции.РФ"));
app.get('/contact', (req, res) => res.send("Контакты: info@conferences.rf"));

app.get('/register', (req, res) => {
  res.send(`
    <form method="POST" action="/register">
      <label for="login">Логин:</label>
      <input type="text" name="login" id="login" placeholder="Введите логин"><br>
      
      <label for="password">Пароль:</label>
      <input type="password" name="password" id="password" placeholder="Введите пароль"><br>
      
      <label for="fullname">ФИО:</label>
      <input type="text" name="fullname" id="fullname" placeholder="Введите ФИО"><br>
      
      <label for="phone">Телефон:</label>
      <input type="text" name="phone" id="phone" placeholder="Введите телефон"><br>
      
      <label for="email">Email:</label>
      <input type="email" name="email" id="email" placeholder="Введите email"><br>
      
      <button type="submit">Зарегистрироваться</button>
    </form>
  `);
});

app.post('/register', (req, res) => {
  const { login, password, fullname, phone, email } = req.body;
  res.send(`
    <h1>Форма заполнена!</h1>
    <p>Логин: ${login}</p>
    <p>Пароль: ${password}</p>
    <p>ФИО: ${fullname}</p>
    <p>Телефон: ${phone}</p>
    <p>Email: ${email}</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
});
