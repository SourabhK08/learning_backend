import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'


const app = express()

//app.use() -> mainly used for adding configurations & middleware

// major configurations

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit:'16kb'    // we use this as we limit our backend accepting data
}))

app.use(express.urlencoded({
    extended:true,
    limit:'16kb'
}))

app.use(express.static('public'))// Ye public folder ko static bana deta hai. Matlab is folder me rakhe files (like images, CSS, favicon) ko browser directly access kar sakta hai

app.use(cookieParser())


// import routes
import userRouter  from './routes/user.route.js';

// routes declaration using middleware
app.use('/api/users',userRouter)

// https://localhost:8000/api/users/register
// https://localhost:8000/api/users/login

export default app;