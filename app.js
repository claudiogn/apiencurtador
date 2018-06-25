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
var alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
var base = alphabet.length;


mongoose.connect('mongodb://localhost/test')
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
    var url = new Url()

    url.longUrl=req.body.longUrl

    encoded  = encode(id)
    id=id+2
    url.shortUrl = encoded
    id=id+2

    url.description = ''
    url.active=true
    url.clicks=0
    url.timeStamp = new Date
    url.lastAccess = new Date

    url.save(function(error){
      if (error) {
        res.send('Erro: '+error)
      }
      res.json({message: 'URL encurtada'})
    })
  })


    router.post('/expand', (req,res)=>{
      Url.findOne({'shortUrl':req.body.shortUrl},(error,url)=>{
        if (error)
          res.json({message:error})
        if(url){
          url.clicks= url.clicks+1
          url.save((error)=>{
            if (error)
              res.send(error)
            res.json({
              shortUrl:url.shortUrl,
              longUrl:url.longUrl
            })
          })}
          else{
            res.json({message:'Link not found'})
          }
      })
    })


  router.get('/links',(req,res,next)=>{
    if (Object.keys(req.query).length) next('route')
    next()
  }, (req,res,next)=>{
    Url.find((error,urls)=>{
        if (error)
          res.send("Erro ao listar: "+error)
        res.json(urls)
    }) 
  })
  router.get('/links', (req,res)=>{
    
  })




  router.get('/links/:hash/clicks', (req,res)=>{
    Url.findOne({'shortUrl':req.params.hash},(error,url)=>{
      if (error){
        res.json({message:error})
        return
      }
      if (url) {
        response={
          clicks: url.clicks
        }
        res.json(response)
      }
      else
        res.json({message: 'Url not found'})
    })
  })  

  router.route('/links/:hash')
        .delete((req,res)=>{
          Url.findOne({'shortUrl':req.params.hash},(error, url)=>{
            if (error)
              res.send('Error' + error)
            url.active=false
            url.save((error)=>{
              if (error) 
                res.send(error)
              res.json({message:"Url deleted"})
            })
          })
        })

        .patch((req,res)=>{
          Url.findOne({'shortUrl':req.params.hash},(error,url)=>{
            if (error)
              res.send(error)
            url.description = req.body.description
            url.save ((error)=>{
              if (error) 
                res.send(error)
              res.json({message:'Url updated'})
            })
          })
        })

        .get((req,res)=>{
          Url.findOne({'shortUrl': req.params.hash}, (error,url)=>{
            if (error)
              res.json({error: error})
            if (url)
              res.json(url)
            else
              res.json({error: 'Url not found'})
          })
        })
        

  app.use('/api', router)


app.listen(3000, function(){
	console.log('Servidor on')
});