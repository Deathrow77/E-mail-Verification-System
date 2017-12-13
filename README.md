# E-mail-Verification-System
Email Verification System created using Node.js and Redis with Mandrill API by MailChimp

#How to run?
1. Clone the repository first into your system.
2. Install Redis Server, npm and Node.js into your system.
      a. Redis Server  --- sudo apt-get install redis-server
      b. Nodejs and NPM --- sudo apt-get install nodejs nodejs-legacy npm
3. Open the terminal inside the repository folder and execute 'sudo npm install'
4. After the node modules are installed, make sure to sign in on the Mailchimp Mandrill website and obtain an API Key.
5. Enter the API Key into apikey section of the index.js file.
6. In the terminal window, run the Redis server by executing 'redis-server &'
7. Then, in another terminal window, execute 'npm start' and then navigate to localhost:3000 in your browser window.
