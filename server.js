
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { parse } = require('json2csv');
const csvjson = require('csvjson');
const axios = require('axios');

const app = express();
const port = 8000;

let uploadedData = [];
let csvData;
let filePath = null;

// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and urlencoded form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
/**const upload = multer({ dest: 'uploads/' });**/
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

const upload = multer({
    
    fileFilter: fileFilter,
    dest: 'uploads/'

});

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});

// Route for the upload page
app.get('/upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Route for the display page
app.get('/display.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// Route to handle file upload
app.post('/upload', upload.single('fileToUpload'), (req, res) => {
    //console.log('File uploaded:', uploadedfilepath);
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    // Parse the CSV file
    filePath = path.join(__dirname, req.file.path);
    /**fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading CSV file:', err);
            res.status(500).send('Error reading CSV file');
            return;
        }
        // Store the CSV data in a variable
        const csvData = data;
    });**/
    
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            uploadedData.push(row);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            //console.log('Uploaded data:', uploadedData);
            res.redirect('/display.html');
        });
});

// Route to get the uploaded data
app.get('/data', (req, res) => {
    res.json(uploadedData);
    //console.log('Uploaded data:', uploadedData);
});

app.post('/train', async (req, res) => {
    //console.log('File path', filePath);
    if (!filePath) {
        return res.status(400).send('No CSV file uploaded yet!');
    }
    //console.log('File uploaded:', filePath);
    try {
        // Check if a file was previously uploaded
        const csvData = await fs.promises.readFile(filePath, 'utf-8');
        const url = 'http://localhost:5000/train';
        const response = await fetch(url, {
            method: 'POST',
            body: csvData,
            headers: {
                'Content-Type': 'text/csv'
            }                                                                                                                       
        });
        res.send(response);
        //console.log('Response from Flask:',response.data.selected_features);
        //if (response.data && response.data.selected_features) {
        //} //else {
            //res.status(500).send('Training failed');
        //}
        //console.log('Response from Flask:', response.data);
    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).send('Error sending processing request'); // Send an error response
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
