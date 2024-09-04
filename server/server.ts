import { app } from "./app";
require("dotenv").config();
import { v2 as cloudinary} from 'cloudinary';

cloudinary.config({
    cloud_name: 'doi13tpyz', 
    api_key: '242191266474328', 
    api_secret: process.env.CLOUD_SECRET_KEY
})

//creating server
app.listen(process.env.PORT, () => {
    console.log(`Server is connected with port ${process.env.PORT}`);
 
});