const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = 3000;
const config = require('./config.json');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const Schema = mongoose.Schema;
const User = require('./models/users');
const Item = require('./models/items');
const Comment = require('./models/comments');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());
app.use('/uploads', express.static('uploads'));


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
});

const filterFile = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    } else {
        req.validationError = 'invalid extension';
        cb(null, false, req.validationError);
    }
};

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

app.get('/view', function(req, res){
    console.log('working');
    Item.find().then(result => {
        res.send(result);
    });
});

// CREATE A NEW USER
//////////////////////
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

//READ ALL USERS
//////////////////////
app.get('/allUsers', function(req, res){
    console.log('working');
    User.find().then(result => {
        res.send(result);
    });
});

// VALIDATE A USER
//////////////////////
app.post('/getUser', function(req,res){
    User.findOne({username: req.body.username}, function(err, getUser){
        if(getUser){
            if(bcrypt.compareSync(req.body.password, getUser.password)){
                res.send(getUser);
            } else {
                console.log('invalid password');
            }
        } else {
            res.send('user does not exist');
        }
    });
});


// UPDATE A USER
////////////////
app.patch('/users/:id', function(req, res){
    const id = req.params.id;
    const hash = bcrypt.hashSync(req.body.password);
    User.findById(id, function(err, user){
        // CHECK THE LINE BELOW: Should 'user.id' be 'user_id'? Is "userId" ok?
        if(user['user.id'] == req.body.userID){
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

// DELETE A USER
////////////////

// CREATE A NEW ITEM
//////////////////////
app.post('/addItem', upload.single('uploadedImage'),function(req, res){
    console.log(req.body);
    res.send('from post req');
    const item = new Item({
        _id:  new mongoose.Types.ObjectId(),
        item_name: req.body.itemName,
        item_description: req.body.itemDescription,
        clothing_type:   req.body.itemType,
        image_URL: req.file.path,
        price: req.body.price,
        condition: req.body.itemCondition,
        user_id: req.body.userID,
        bought: req.body.itemBought
    });
    item.save().then(result => {
        res.send(result);
    }).catch(err => res.send(err));
});

//READ ALL ITEMS
//////////////////////
app.get('/allItems', function(req, res){
    Item.find().then(result => {
        res.send(result);
    });
});


// READ A SINGLE ITEM
//////////////////////
app.post('/addItem/:id', function(req,res){
    const id = req.params.id;
    Item.findById(id, function(err, item){
        if (item.user_id == req.body.userID) {
            res.send(item);
        } else {
            res.send('401');
        }
    });
});


// UPDATE AN ITEM

app.get('/getItem/:id', function(req, res){
    // res.send('hello from the single item route');
    const id = req.params.id;
    Item.findById(id, function(err, item){
        res.send(item);
    });
});

app.patch('/editItem/:id', function(req,res){
    const id = req.params.id;
    console.log(id);
    Item.findById(id, function(err,item){
        console.log('running update');
        if (item.user_id == req.body.userID) {
            const newItem = {
                item_name: req.body.itemName,
                item_description: req.body.itemDescription,
                clothing_type:   req.body.itemType,
                // image_URL: String,
                // you need to get Multer working!
                price: req.body.price,
                condition: req.body.itemCondition,
                user_id: req.body.userID,
                bought: req.body.itemBought
            };
            Item.updateOne({_id: id}, newItem).then(result =>{
                res.send(result);
            }).catch(err => res.send(err));
        } else {
            res.send('401');
        }
    }).catch(err=> res.send('cannot find Item with that id'));
});


// DELETE AN ITEM
//////////////////////
app.delete('/addItem/:id', function(req, res){
    const id = req.params.id;
    // console.log(id);
    Item.findById(id, function(err, item){
        if (err) {
            res.send('cannot find image to delete from mongo');
        } else {
            if (fs.existsSync(item.image_URL)) {
                fs.unlink(item.image_URL, (err) => {
                    if (err) {
                        res.send('cannot delete image from server');
                    } else {
                        Item.deleteOne({_id:id},function(err){
                            if (err) {
                                res.send('Cannot delete image from mongoDB');
                            } else {
                                res.send('image was removed from mongoDB');
                            }
                        })
                    }
                })
            } else {
                res.send('Cannot find image to delete in the server');
            }
        }
    }).catch(err => res.send('cannot find an item with that id'));
});

app.listen(port, () => {
    console.log(`application is running on port ${port}`);
});
