const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth.routes");
const advRoutes = require('./routes/advocate.routes');
const coordinateRoutes = require('./routes/coordinate.routes');
const uploadRoutes = require('./routes/upload.routes')
const bannerRoutes = require('./routes/banner.routes')


const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from vakilekta backend');
});


app.use("/api/auth", authRoutes);

app.use("/api/advocate", advRoutes);

app.use("/api/coordinates", coordinateRoutes)

app.use("/api/upload-profile", uploadRoutes)

app.use('/api/Banner',bannerRoutes)

app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
});
