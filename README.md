# Thread Back End

### Before you start

This project is the back-end part of our mongoDB project. It connects to [mongodb](https://www.mongodb.com/).  
The repo for our front-end is located here: [thread-front-end](https://github.com/alexsophiekim/thread-front-end).  

## Installation
To install everything needed for this project, you need to have a stable version of Node JS and NPM installed on your computer or server.

### Clone and install the back-end project
```sh
$ git clone https://github.com/alexsophiekim/thread-back-end
$ cd thread-back-end
$ npm install

```
Now, rename the **config.example.json** file as **config.json** and complete the following lines with a username, password, and cluster name that you have already set up on mongoDB.  
```json
{
    "MONGO_USER": "",
    "MONGO_PASSWORD": "",
    "MONGO_CLUSTER_NAME": ""
}

```
### Last step
```sh
$ node server
```
