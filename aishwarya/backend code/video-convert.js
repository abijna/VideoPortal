var express = require('express');
var cors = require('cors')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
var PORT = 8080;


const app = express();
app.use(cors());
app.use(express.static(__dirname ));

//your path to source file


app.get('/:track/:format', (req, res) => {
    console.log("hello")
    if(req.params.format!="mp4")
    {
        res.status(200);
        let track = './uploads/'+req.params.track+'/video.'+req.params.format;
        ffmpeg(track)
        .toFormat('mp4')
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
        })
        .on('progress', (progress) => {
            // console.log(JSON.stringify(progress));
            console.log('Processing: ' + progress.targetSize + ' KB converted');
        })
        .on('end', () => {
            ffmpeg('./uploads/'+req.params.track+'/video.mp4')
            .size('480x360')
            .on('error', (err) => {
                console.log('An error occurred: ' + err.message);
            })
            .on('progress', (progress) => {
                // console.log(JSON.stringify(progress));
                console.log('Processing: ' + progress.targetSize + ' KB converted');
            })
            .on('end', () => {
                console.log('Processing finished !');
            })
            .save('./uploads/'+req.params.track+'/video360.mp4');//path where you want to save your file
    
            console.log('Processing finished !');
        })
        .save('./uploads/'+req.params.track+'/video.mp4');//path where you want to save your file
    }
    else{
        ffmpeg('./uploads/'+req.params.track+'/video.mp4')
        .size('160x90')
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
        })
        .on('progress', (progress) => {
            // console.log(JSON.stringify(progress));
            console.log('Processing: ' + progress.targetSize + ' KB converted');
        })
        .on('end', () => {
            console.log('Processing finished !');
        })
        .save('./uploads/'+req.params.track+'/video360.mp4');//path where you want to save your file
    }
    res.send();
    return;
});


app.listen(PORT);
console.log(`Running on ${PORT}`);
