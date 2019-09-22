const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = 3000;
const config = require('./config.json');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const User = require('./models/users');
const Item = require('./models/items');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());

mongoose.connect(`mongodb+srv://${config.MONGO_USER}:${config.MONGO_PASSWORD}@${config.MONGO_CLUSTER_NAME}.mongodb.net/summative3?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log(`We're connected to MongoDB!`);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
})

const filterFile = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    } else {
        req.validationError = 'invalid extension';
        cb(null, false, req.validationError);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: filterFile
});

app.use(function(req, res, next){
    console.log(`${req.method} request for ${req.url}`);
    next();
});

app.get('/', function(req, res){
    res.send('Welcome to our Products API. Use endpoints to filter out the data');
});
app.post('/addItem', upload.single(`filePath`), function(req,res){
  console.log('add item working');
    const item = new Item({
      _id: new mongoose.Types.ObjectId(),
      item_name: req.body.itemName,
      clothing_type: req.body.clothingType,
      image_URL: req.file.path,
      price: req.body.price,
      condition: req.body.condition
    });
    item.save().then(result=>{
      res.send(result)
    }).catch(err => res.send(err))
});

app.get('/view', function(req, res){
    console.log('working');
    Item.find().then(result => {
        res.send(result);
    })
});

app.post('/users',function(req,res){
  User.findOne({username:req.body.username}, function(err,result){
    if (result) {
      res.send('Invalid user');
    } else {
      const hash = bcrypt.hashSync(req.body.password);
      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        username: req.body.username,
        email: req.body.email,
        password: hash
      });
      user.save().then(result => {
        res.send(result);
      }).catch(err => res.send(err));
    }
  });
});

app.post('/getUser', function(req,res){
    User.findOne({username: req.body.username}, function(err, getUser){
        if(getUser){
             if(bcrypt.compareSync(req.body.password, getUser.password)){
                 res.send(getUser);
             } else {
                 console.log('incorrect password');
             }
        } else {
            res.send('user does not exist');
        }
    });
});

// Update user details (username, email, password) based on id
app.patch('/users/:id', function(req, res){
    const id = req.params.id;
    const hash = bcrypt.hashSync(req.body.password);
    User.findById(id, function(err, user){
        // CHECK THE LINE BELOW: is "userId" ok?
        if(user['user.id'] == req.body.userId){
            const newUser = {
                username: req.body.username,
                email: req.body.email,
                password: hash
            };
            User.updateOne({ _id: id}, newUser).then(result => {
                res.send(result);
            }).catch(err => res.send(err));
        } else {
            res.send('401');
        }
    }).catch(err => res.send('Sorry, cannot find user with that id'));
});

app.listen(port, () => {
    console.log(`application is running on port ${port}`);
});
