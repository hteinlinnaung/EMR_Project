import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
//import cookieParser from 'cookie-parser';
import logger from 'morgan';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';

import patientRouter from './routes/patients.route';
import medicineRouter from './routes/medicines.route';
import diseaseRouter from './routes/diseases.route';
import doctorRouter from './routes/doctors.route';
import tagRouter from './routes/tags.route';
import emrImageRouter from './routes/emr.images.route';
import emrRouter from './routes/emr.route';

//import auth from './middleware/auth';
import config from './config/database';

//import setupRoutes from "./routes";

import HttpLoggerMiddleware from './middleware/http.logger.middleware';

dotenv.config();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

/********************/
// Configure CORS
const corsOptions = {
    origin: ['http://localhost:5000',
        'http://localhost:9999',
        'http://localhost:5174',
    ], // Allow requests from this origin
    optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions)); // Use cors middleware with options

app.use(helmet());
app.use(express.json()); //this is bodyParser.json()
app.use(express.urlencoded({ extended: true }));

app.use(HttpLoggerMiddleware);

//app.use(cookieParser());

/************************/

mongoose
    .connect(config.db)
    .then(() => console.log('MongoDB connected!'))
    .catch((err) => console.log(err));

/************************/

const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        let date = new Date();
        let imageFileName = date.getTime() + '_' + file.originalname;
        req.body.imageFileName = imageFileName;
        cb(null, imageFileName);
    },
});

const upload = multer({
    storage: storage,
}).any();

// Initialize upload

// Route
app.post('/api/emrs/uploads', upload, (req: Request, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ msg: 'No file selected!' });
    } else {
        const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => ({
            image: `uploads/${file.filename}`,
        }));

        return res.status(200).json({
            msg: 'Files uploaded!',
            images: uploadedFiles,
        });
    }
});

/******************/

//setupRoutes(app);
app.use('/api/patients', patientRouter);
app.use('/api/medicines', medicineRouter);
app.use('/api/diseases', diseaseRouter);
app.use('/api/doctors', doctorRouter);
app.use('/api/tags', tagRouter);
app.use('/api/emrImages', emrImageRouter);
app.use('/api/emrs', emrRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
    next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log('Server Error: ', err); // Ensure this logs the error details
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default app;
