angular.module('myApp').factory('AuthService',
  ['$q', '$timeout', '$http',
  function ($q, $timeout, $http) {

    // create user variable
    var user = null;

    // return available functions for use in the controllers
    return ({
      isLoggedIn: isLoggedIn,
      getUserStatus: getUserStatus,
      login: login,
      logout: logout,
      register: register,
      generateKeys :generateKeys,
      privateKey:privateKey,
      publicKey:publicKey,
      Blind :Blind
    });

    function isLoggedIn() {
      if(user) {
        return true;
      } else {
        return false;
      }
    }

    function getUserStatus() {
      return $http.get('/user/status')
      // handle success
      .success(function (data) {
        if(data.status){
          user = true;
        } else {
          user = false;
        }
      })
      // handle error
      .error(function (data) {
        user = false;
      });
    }

    function login(username, password) {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a post request to the server
      $http.post('/user/login',
        {username: username, password: password})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.status){
            user = true;
            deferred.resolve();
          } else {
            user = false;
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          user = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function logout() {

      // create a new instance of deferred
      var deferred = $q.defer();

      // send a get request to the server
      $http.get('/user/logout')
        // handle success
        .success(function (data) {
          user = false;
          deferred.resolve();
        })
        // handle error
        .error(function (data) {
          user = false;
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function register(username, password,  e, n, d) {

      // create a new instance of deferred
      var deferred = $q.defer();
      // send a post request to the server
      $http.post('/user/register',
        {username: username, password: password, e:e, n:n, d:d})
        // handle success
        .success(function (data, status) {
          if(status === 200 && data.status){
            deferred.resolve();
          } else {
            deferred.reject();
          }
        })
        // handle error
        .error(function (data) {
          deferred.reject();
        });

      // return promise object
      return deferred.promise;

    }

    function generateKeys (bitlength) {

      var p, q, n, phi, e, d, keys = {};
      this.bitlength = bitlength || 2048;
      console.log("Generating RSA keys of", this.bitlength, "bits");
      p = prime(this.bitlength / 2);
      do {
        q = prime(this.bitlength / 2);
      } while (q.compare(p) === 0);
      n = p.multiply(q);

      phi = p.subtract(1).multiply(q.subtract(1));

      e = bigInt(65537);
      d = bigInt(e).modInv(phi);

      keys.publicKey = new publicKey(this.bitlength, n, e);
      keys.privateKey = new privateKey(p, q, d, keys.publicKey);
      return keys;
    }

    function prime (bitLength) {
      var rnd = bigInt.zero;
      var isPrime = false;
      var two = new bigInt(2);

      while (!isPrime) {
        rnd = bigInt.randBetween(two.pow(bitLength - 1), two.pow(bitLength));
        if (rnd.isPrime()) {
          isPrime = true;
        }
      }
      return new bigInt(rnd);
    }

    function privateKey (p, q, d, publicKey) {
      this.p = p;
      this.q = q;
      this.d = d;
      this.publicKey = publicKey;
    }

    function publicKey (bits, n, e) {
      this.bits = bits;
      this.n = n;
      this.e = e;
    }

    /*function getKeysServer(){

      var n_server;
      var e_server;
      return $http.get('/user/keys').success(function (data) {

        n_server = bigInt(data.n);
        e_server = bigInt(data.e);
        //console.log('numero aleatorio', random);

        console.log('clave del servidor n', data.n);



      }).error(function (data) {
            console.log('Error: ' + data);
          });

      return {data : data.n};



    }*/


    function Blind(Kpub_Cliente,e_server,n_server) {

      console.log('Esta es la clave publica del cliente:',Kpub_Cliente);
      console.log('eee', e_server);
      console.log('nnnn', n_server);

      var bigrandom = bigInt.randBetween(0, n_server);

      console.log('biginteger'+bigrandom);

      Kpub_Cliente_bigInt = new bigInt (Kpub_Cliente, 16);

      console.log('Kpub_Cliente_bigInt', Kpub_Cliente_bigInt);

      var result = blindmessage(Kpub_Cliente_bigInt,bigrandom,e_server,n_server);

      console.log('clave publica cegada', result);

      $http.post('http://localhost:3000/user/message/blind', {"result" : result.toString(16)}).success(function(data) {

        var keyCegadoFirmado = bigInt(data.signed16);
        console.log(keyCegadoFirmado);

        var keyfirmado = (keyCegadoFirmado.multiply(bigrandom.modInv(n_server))).mod(n_server);

        console.log('MSG EN HEX: '+keyfirmado.toString(16));

        var verify = keyfirmado.modPow(e_server,n_server);

        var verifytohex = verify.toString(16);

        var verifystring =hex2a(verifytohex);
        console.log("mi key" +verifystring);

        return keyfirmado;

      })
          .error(function(data) {
            console.log('Error: ' + data);
          });

    }

    function blindmessage (Kpub_Cliente,random,e,n){
      return  (Kpub_Cliente.multiply(random.modPow(e,n))).mod(n);
    }

    function hex2a(hexx) {
      var hex = hexx.toString();//force conversion
      var str = '';
      for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      return str;
    }


}]);