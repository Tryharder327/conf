import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import session from "express-session";
import bcrypt from "bcryptjs";
import { Users, Rooms, Requests } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;
const ADMIN_LOGIN = "Conf2027";

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

app.use(express.static(join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "conf2027-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.isAdmin = req.session.login === ADMIN_LOGIN;
  next();
});

const INACTIVITY_LIMIT = 20 * 60 * 1000;

app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    const now = Date.now();

    if (req.session.lastActivity && now - req.session.lastActivity > INACTIVITY_LIMIT) {
      return req.session.destroy(() => {
        res.redirect("/login");
      });
    }

    req.session.lastActivity = now;
  }

  next();
});

const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }

  return res.redirect("/login");
};

const requireAdmin = (req, res, next) => {
  if (req.session.login === ADMIN_LOGIN) {
    return next();
  }

  return req.session.userId
    ? res.redirect("/dashboard")
    : res.redirect("/login");
};

const RULES = [
  {
    field: "login",
    test: v => /^[A-Za-z0-9]{6,}$/.test(v),
    msg: "Логин: латиница и цифры, минимум 6 символов"
  },
  {
    field: "password",
    test: v => v && v.length >= 8,
    msg: "Пароль: минимум 8 символов"
  },
  {
    field: "fio",
    test: v => /^[А-Яа-яЁё\s-]+$/.test(v),
    msg: "ФИО: только кириллица, пробелы и дефис"
  },
  {
    field: "phone",
    test: v => /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(v),
    msg: "Телефон: формат 8(ХХХ)ХХХ-ХХ-ХХ"
  },
  {
    field: "email",
    test: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    msg: "Email: некорректный формат"
  }
];

const validate = data => RULES
  .filter(({ field, test }) => !test((data[field] || "").trim()))
  .map(rule => rule.msg);

app.get("/", (req, res) => {
  res.redirect("/rooms");
});

app.get("/rooms", (req, res) => {
  const rooms = Rooms.findAll();
  res.render("rooms", {
    title: "Помещения",
    rooms
  });
});

app.get("/rooms/type/:type", (req, res) => {
  const rooms = Rooms.findByType(req.params.type);
  res.render("rooms", {
    title: `Помещения: ${req.params.type}`,
    rooms
  });
});

app.get("/auth", (req, res) => {
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("auth", {
    title: "Регистрация",
    mode: "register",
    form: {},
    errors: [],
    flash: null
  });
});

app.get("/login", (req, res) => {
  const flash = req.session.flash || null;
  delete req.session.flash;

  res.render("auth", {
    title: "Вход",
    mode: "login",
    error: null,
    flash
  });
});

app.post("/register", (req, res) => {
  const errors = validate(req.body);

  if (Users.exists((req.body.login || "").trim())) {
    errors.push("Логин уже занят");
  }

  if (errors.length) {
    return res.render("auth", {
      title: "Регистрация",
      mode: "register",
      form: req.body,
      errors,
      flash: null
    });
  }

  Users.create(req.body);

  req.session.flash = {
    type: "success",
    text: "Регистрация успешна. Войдите."
  };

  res.redirect("/login");
});

app.post("/login", (req, res) => {
  const user = Users.findByLogin((req.body.login || "").trim());

  if (user && bcrypt.compareSync(req.body.password || "", user.password)) {
    req.session.userId = user.id;
    req.session.fio = user.fio;
    req.session.login = user.login;
    req.session.lastActivity = Date.now();

    return res.redirect(user.login === ADMIN_LOGIN ? "/admin" : "/dashboard");
  }

  res.render("auth", {
    title: "Вход",
    mode: "login",
    error: "Неверный логин или пароль",
    flash: null
  });
});

app.all("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/dashboard", requireAuth, (req, res) => {
  const requests = Requests.findByUser(req.session.userId);

  res.render("requests_list", {
    title: "Мои заявки",
    isAdmin: false,
    requests
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  const requests = Requests.findAllDetailed();

  res.render("requests_list", {
    title: "Панель администратора",
    isAdmin: true,
    requests
  });
});

app.post("/admin", requireAdmin, (req, res) => {
  const allowedStatuses = ["Новая", "Мероприятие назначено", "Завершено"];

  if (allowedStatuses.includes(req.body.status)) {
    Requests.updateStatus(req.body.id, req.body.status);
  }

  res.redirect("/admin");
});

app.get("/create", requireAuth, (req, res) => {
  res.render("create_request", {
    title: "Новая заявка",
    rooms: Rooms.findAll(),
    errors: [],
    form: {}
  });
});

app.post("/create", requireAuth, (req, res) => {
  const errors = [];

  const roomId = Number(req.body.room_id);
  const room = Rooms.findById(roomId);

  if (!room) {
    errors.push("Выберите помещение");
  }

  if (!req.body.date_start) {
    errors.push("Укажите дату начала конференции");
  } else {
    const today = new Date().toISOString().slice(0, 10);

    if (req.body.date_start < today) {
      errors.push("Дата не может быть в прошлом");
    }
  }

  const allowedPayments = [
    "При очном посещении",
    "Перевод по СБП"
  ];

  if (!allowedPayments.includes(req.body.payment)) {
    errors.push("Выберите способ оплаты");
  }

  if (errors.length) {
    return res.render("create_request", {
      title: "Новая заявка",
      rooms: Rooms.findAll(),
      errors,
      form: req.body
    });
  }

  Requests.create({
    userId: req.session.userId,
    roomId,
    dateStart: req.body.date_start,
    payment: req.body.payment
  });

  res.redirect("/dashboard");
});

app.use((req, res) => {
  res.status(404).send("404 - страница не найдена");
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});