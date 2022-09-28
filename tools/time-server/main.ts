import http from 'http';

http.createServer(function (req, res) {
    res.write((new Date()).toISOString()); //write a response to the client
    res.end(); //end the response
  }).listen('http.sock'); //the server object listens on port 8080 
