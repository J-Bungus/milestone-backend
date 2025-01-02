const express = require("express");
const bodyParser = require("body-parser");
const pg = require("pg");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv").config();
const sgMail = require('@sendgrid/mail');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const client = require('twilio')(process.env.TWILIO_ACCOUNT_ID, process.env.TWILIO_AUTH_TOKEN);
const path = require('path');
const errorHandler = require("./middleware/errorHandler");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
morgan.token("clientIp", (req) => (req.headers["x-forwarded-for"] || req.clientIp || req.ip || req._remoteAddress || "unknown"));
const storage = new Storage({
  keyFilename: path.join(__dirname, process.env.GCP_CREDENTIALS),
  projectId: process.env.GCP_PROJECT_ID
});

global.twilio = client.verify.v2.services(process.env.TWILIO_SERVICE_SID);

const bucket = storage.bucket(process.env.GCP_BUCKET);
global.bucket = bucket;

const upload = multer({ storage: multer.memoryStorage() });
global.upload = upload;

const Pool = pg.Pool;
global.pool = process.env.ENV === 'dev'
  ? new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DATABASE
  })
  : new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

global.sgMail = sgMail;

const app = express();
app.use(cors({
  origin: `${process.env.WEBSITE_URL}`,
  methods: 'GET,POST,PATCH,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.options("*", cors({
  origin: `${process.env.WEBSITE_URL}`,
  methods: 'GET,POST,PATCH,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

app.use(bodyParser.urlencoded({ limit: '250kb', extended: false }));
app.use(bodyParser.json({ limit: '250kb' }));
app.use(morgan(":method :url - :clientIp", { immediate: true }));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/invoice", require("./routes/invoiceRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));