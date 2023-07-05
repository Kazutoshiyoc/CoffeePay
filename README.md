<br>
<p align="center">
  <img src="https://github.com/Kazutoshiyoc/CoffeePay/blob/main/CoffeePay.svg" style="width:15rem;"/>
  <br><br>
  CoffeePay provides automatically redirects to the PayPay payment link to get coffee.
</p>

---


## Quick-start

### Initial set-up

1. Clone the CoffeePay and resolve dependency.

    ```
    cd ~; git clone https://github.com/Kazutoshiyoc/CoffeePay.git
    cd CoffeePay
    npm install
    ```

1. Get and store your Google Drive token

    ```
    cd ~/CoffeePay/function/googleapi/credential/drive
    node getAndStoreToken_drive.js
    ```

1. Create the data storage on your Google Drive

    ```
    cd ~/CoffeePay
    node init.js
    ```

1. Set the environment variables

    ```
    cd ~/CoffeePay
    mv .env.sample .env
    vi .env
    ```

    ### A) Launch the CoffeePay server on a local

    1. Change an ENVIRONMENT value to "Local"

        ```
        cd ~/CoffeePay
        vi .env
        ```

    1. Launch the CoffeePay server

        ```
        cd ~/CoffeePay
        node server.js
        ```

    ### B) Deploy on the Heroku

    1. Change an ENVIRONMENT value to "Heroku"

        ```
        cd ~/CoffeePay
        vi .env
        ```

    1. Create a Heroku app & Set the Config Vars

    1. Deploy on Heroku

---

## Dependency

* Node.js

    * Google REST API (googleapis)
    * dotenv
    * ejs
    * fs
    * http
    * moment-timezone
    * querystring
    * require
