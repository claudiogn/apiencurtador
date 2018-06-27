var express= require('express');
var bodyParser = require('body-parser')
var url = require('url')
var mongoose = require('mongoose')
var Url = require('./app/models/url')

var app = express()
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())


var router = express.Router()

var id = 10000  



mongoose.connect('mongodb://localhost/dblinks')
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Success')
});


function encode(num){
  var encoded = '';
  while (num){
    var remainder = num % base;
    num = Math.floor(num / base);
    encoded = alphabet[remainder].toString() + encoded;
  }
  return encoded;
}



    router.post('/shorten',(req, res)=>{
        if (req.body.longUrl) { 
            try{

                Url.findOne({'longUrl': req.body.longUrl}, (error,url)=>{
                    if (url) {
                        res.json(url)
                    }else{
                        var new_url = new Url()
                        new_url.longUrl=req.body.longUrl

                        new_url.shortUrl = ''

                        if (req.body.description) {
                            new_url.description = req.body.description
                        }else{
                            new_url.description = ''
                        }
                        new_url.active=true
                        new_url.clicks=0
                        new_url.timeStamp = new Date
                        new_url.lastAccess = new Date

                        new_url.save(function(error){
                        if (error) {
                            res.json({error: error})
                        }
                        res.json(new_url)
                        })
                    }
              })
            }catch(err){
                res.json({error: 'Unable to shorten'})
            }
        }else{
            res.json({error: 'Bad request'})
        }
    })


    router.post('/expand', (req,res)=>{
        try{    
            if (req.body.shortUrl) {
                Url.findOne({'shortUrl':req.body.shortUrl},(error,url)=>{
                    if (error)
                      res.json({message:error})
                    if(url){
                        if (url.active==false) {
                            res.json({message:'Link not found'})
                        }else{
                            url.save((error)=>{
                                if (error)
                                 res.json({error:'Bad request'})
                                res.json({
                                    shortUrl:url.shortUrl,
                                    longUrl:url.longUrl
                                })
                            })
                        }
                    }else{
                        res.json({message:'Link not found'})
                    }
                })
            }else{
                res.json({error: 'Bad request'})
            }    
        }catch(error){
            res.json({error:'Bad request'})
        }
    })


    router.get('/links',(req,res,next)=>{
        if (Object.keys(req.query).length){
                next('route')

            }else{
                next()
            }


        }, (req,res,next)=>{
        Url.find({'active':true},(error,urls)=>{
            if (error)
                res.json({error: error})
            if(urls)
                res.json(urls)
            else
                res.json({message: 'No shorten URLs'})
        }) 
    })


    router.get('/links', (req,res)=>{
        if (req.query.state && req.query.size) {
            state=true
            try{
                Url.find({'active': state})
                    .limit(parseFloat(req.query.size))
                    .sort({'timeStamp': -1})
                    .exec((error,urls)=>{
                        if (error) {
                            res.json({error:error})
                        }else{
                            res.json(urls)
                        }
                })
            }catch(error){
                res.json({error: 'Bad request'})
            }     
        }else{
            res.json({error: 'Bad request'})
        }
    })


    router.get('/links/find',(req,res)=>{
        try{
            if (req.query.url) {
                Url.findOne({'longUrl': req.query.url}, (error,url)=>{
                    if(error)
                        res.json(error)
                    else if (url) {
                        if (url.active==false) {
                            res.json({message: 'URL not found'})
                        }else{
                            obj = {longUrl:url.longUrl,
                                shortUrl:url.shortUrl}
                            res.json(obj)
                        }
                    }else{
                        res.json({error:'URL not found'})
                    }
                    
                })
            }else if (req.query.link) {
                Url.findOne({'shortUrl': req.query.link}, (error,url)=>{
                    if(error)
                        res.json(error)
                    else if (url) {
                        if (url.active==false) {
                            res.json({message: 'URL not found'})
                        }else{
                            obj = {longUrl:url.longUrl,
                                shortUrl:url.shortUrl}
                            res.json(obj)
                        }
                    }else{
                        res.json({error:'URL not found'})
                    }
                    
                })
            }else{
                res.json({error:'Bad request'})
            }
        }catch(error){
            res.json({error: 'Bad request'})
        }
    })





    router.get('/links/:hash/clicks', (req,res)=>{
        if (req.params.hash){
            Url.findOne({'shortUrl':req.params.hash},(error,url)=>{
                if (error){
                    res.json({message:error})
                }
                else if (url) {
                    if (url.active==false) {
                        res.json({message: 'URL not found'})
                    }else{ 
                        response={
                            clicks: url.clicks
                        }
                        res.json(response)
                    }
                }else
                    res.json({message: 'Url not found'})
            })
        }else{
            res.json({error: 'Bad request'})
        }
    })  

  router.route('/links/:hash')
        .delete((req,res)=>{
            if (req.params.hash) {
                Url.findOne({'shortUrl':req.params.hash},(error, url)=>{
                    if (error)
                        res.send('Error' + error)
                    if (url) {       
                        url.active=false
                        url.save((error)=>{
                            if (error) 
                                res.send(error)
                            res.json(url)
                        })
                    }else{
                        res.json({message: 'URL not found'})
                    }
                })
            }else{
                res.json({error: 'Bad request'})
            }
        })

        .patch((req,res)=>{
            if (req.params.hash && req.body.description ) {
                Url.findOne({'shortUrl':req.params.hash},(error,url)=>{
                    if (error)
                        res.send(error)
                    else if (url) {
                        if (url.active==true) {
                            url.description = req.body.description
                            url.save ((error)=>{
                                if (error) 
                                    res.send(error)
                                res.json(url)
                            })
                        }else{
                            res.json({message: 'URL not found'})
                        }
                    }else{
                        res.json({message: 'URL not found'})
                    }
                })
            }else{
                res.json({message:'Bad request'})
            }
        })

        .get((req,res)=>{
            if (req.params.hash) {  
                Url.findOne({'shortUrl': req.params.hash}, (error,url)=>{
                    if (error)
                        res.json({error: error})
                    else if (url){
                        if (url.active==true) {
                            res.json(url)    
                        }else{
                            res.json({message: 'URL not found'})
                        }
                    }else{
                        res.json({message: 'URL not found'})
                    }
                })
            }else{
                res.json({error:'Bad request'})
            }
        })
        

  app.use('/api', router)

  app.get('/:hash', (req,res)=>{
    if (req.params.hash) {
        Url.findOne({'shortUrl': req.params.hash}, (error,url)=>{
            if (error) {
                res.json(error)
            }else if(url){
                if (url.active==true) {
                    url.clicks = url.clicks+1
                    url.lastAccess= Date.now
                    url.save((error)=>{
                        if (error) {
                            res.json(error)
                        }
                    })
                    link = url.longUrl
                    console.log(link)
                    res.redirect(link)
                }else{
                    res.json({message: 'URL not found'})
                }
          }else{
            res.json({message: 'URL not found'})
          }
        })
    }else{
        res.json({error:'Bad request'})
    }
  })


app.listen(80, function(){
	console.log('Servidor on')
});