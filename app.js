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
    
    Url.findOne({'longUrl': req.body.longUrl}, (error,url)=>{
      if (url) {
        res.json(url)
      }else{
        var new_url = new Url()
        new_url.longUrl=req.body.longUrl

        encoded  = encode(id)
        id=id+2
        new_url.shortUrl = encoded
        id=id+2
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
          res.send('Erro: '+error)
        }
        res.json(new_url)
      })
        }
      })

  })


    router.post('/expand', (req,res)=>{
      Url.findOne({'shortUrl':req.body.shortUrl},(error,url)=>{
        if (error)
          res.json({message:error})
        if(url){
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
    if (Object.keys(req.query).length){
            next('route')

          } else{
                next()
          }


  }, (req,res,next)=>{
    Url.find({'active':true},(error,urls)=>{
        if (error)
          res.send("Erro ao listar: "+error)
        else
          res.json(urls)
    }) 
  })
  router.get('/links', (req,res)=>{

    // Url.find((error,url)=>{
    //   res.json(url)
    // })
    if (req.query.state && req.query.size) {
      if (req.query.state=='open')
        state=true
      else 
        state=false
      Url.find({'active': state})
          .limit(parseFloat(req.query.size))
          .exec((error,urls)=>{
            if (error) {
              res.json({error:error})
            }
            else{
              res.json(urls)
            }
          })
    }else{
      res.json({error: 'Bad request'})
    }
    // else{
    //   Url.find({'active':false})
    // }

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
              res.json(url)
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
              res.json(url)
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

  app.get('/:hash', (req,res)=>{
    Url.findOne({'shortUrl': req.params.hash}, (error,url)=>{
      if (error) {
        res.json(error)
      }else{
        url.clicks = url.clicks+1
        url.save((error)=>{
          if (error) {
            res.json(error)
          }
        })
        link = url.longUrl
        console.log(link)
        res.redirect(link)
      }
    })
  })


app.listen(3000, function(){
	console.log('Servidor on')
});