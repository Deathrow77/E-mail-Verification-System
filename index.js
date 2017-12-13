var express = require('express');
var async = require('async');
var bodyParser = require('body-parser');
var redis = require('redis');
var redisClient = redis.createClient();
var nodemailer = require('nodemailer');
var mandrillTransport = require('nodemailer-mandrill-transport');

var app = express();


// Setting up SMTP Server

var smtpTransport = nodemailer.createTransport(mandrillTransport({
  auth:{
    apiKey:''
  }
}));


var host = 'localhost:3000';
app.use(bodyParser.urlencoded({"extended":false}));

app.get('/', function(req,res){
  res.sendfile('index.html');
});

app.post('/send', function(req,res){
  console.log(req.body.to);
  async.waterfall([
    // Check if Email Id already exists
    function(callback){
      redisClient.exists(req.body.to, function(err,reply){
        if(err){
          return callback(true, "Error Encountered in Redis" + err.toString());
        }
        if(reply==1){
          return callback(true, "Email Already Exists !!!");
        }
        callback(null);
      });
    },
    // Create a verification email
    function(callback){
      let rand = Math.floor((Math.random()*100) + 54);
      let encodedMail = new Buffer(req.body.to).toString('base64');
      let link = 'http://' + req.get('host') + '/verify?mail='+ encodedMail + '&id='+rand;
      let mailOptions = {
        from: 'youremail@domain.com',
        to:req.body.to,
        subject:"Please Confirm you Email Address ",
        html:"Please Click on the link below to confirm your email - <br><a href=" + link + ">Click here to verify</a>"
      };
      callback(null, mailOptions, rand);
    },
    // Send a verification email
    function(mailData,secretKey, callback){
      console.log(mailData);
      smtpTransport.sendMail(mailData, function(error, response){
        if(error){
          console.log(error);
          return callback(true, "Error while sending email ....");
        }
        console.log("Message Sent ::" + JSON.stringify(response));
        redisClient.set(req.body.to, secretKey);
        redisClient.expire(req.body.to, 600);
        callback(null, "Email Sent Successfully.");
      });
    }
  ],
  // Error Check on the waterfall
  function(err,data){
    console.log(err,data);
    res.json({error:err == null ? false : true, data: data});
  });
});

app.get('/verify', function(req,res){
  // Check if the host is same
  if((req.protocol+'://'+req.get('host')) == ('http://'+host)){
    async.waterfall([
      function(callback){
        // decode the email address and check for the validity
        let decodedMail = new Buffer(req.query.mail, 'base64').toString('ascii');
        redisClient.get(decodedMail, function(err,reply){
          if(err){
            return callback(true, "Error In redis");
          }
          if(reply==null){
            return callback(true, "Invalid Email Address ..");
          }
          callback(null, decodedMail, reply);
        });
      },

      // Check if the email address is still present in Redis
      function(key, redisData, callback){
        if(redisData == req.query.id){
          redisClient.del(key, function(err,reply){
            if(err){
              return callback(true, "Error in Redis");
            }
            if(reply!=1){
              return callback(true, "Issue in Redis");
            }
            callback(null, "Email is Verified !!");
          });
        }else{
          return callback(true, "Invalid Token ...");
        }
      }
    ],
    // Error check on Waterfall
    function(err,data){
      res.send(data);
    });
  }else{
    res.end('<h1>Request is from Unknown Source</h1>');
  }
});

app.listen(3000, function(){
    console.log("Express Server Started on " + host.toString());
});
