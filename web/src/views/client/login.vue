<template>
  <div style="background-color: #283643">
    <div class="card loginCard">
      <article class="card-body">
        <h4 class="card-title text-center mb-4 mt-1">Sign in</h4>
        <hr />
        <p v-if="loginError" class="text-danger text-center">
          {{ loginError }}
        </p>
        <div class="form-group">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i class="fa fa-user"></i>
              </span>
            </div>
            <input
              id="loginUsername"
              name=""
              class="form-control"
              placeholder="Username/Email"
              type="text"
            />
          </div>
          <!-- input-group.// -->
        </div>
        <br />
        <!-- form-group// -->
        <div class="form-group">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i class="fa-solid fa-lock"></i>
              </span>
            </div>
            <input
              id="loginPassword"
              class="form-control"
              placeholder="******"
              type="password"
            />
          </div>
          <!-- input-group.// -->
        </div>
        <!-- form-group// -->
        <br />
        <div class="form-group">
          <button
            class="btn btn-primary"
            type="button"
            v-if="loggingIn == true"
            disabled
            style="    background-color: #5c7cfa; border-color: #5c7cfa;"
          >
            <span
              class="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
            Logging in...
          </button>
          <button @click="auth()" class="btn btn-primary btn-block" v-else>
            Login
          </button>

          <button
            v-if="
              $root.$children[0].api_capabilities.capabilities
                .discordAuthentication
            "
            @click="discordAuth()"
            class="btn btn-primary btn-block discordSignin"
          >
            <i
              class="fab fa-discord"
              style="color: var(--bs-button-text); position: relative; left: -2px;"
            ></i>
            Sign in with Discord
          </button>
          <button
            @click="goto('/register')"
            class="btn btn-primary btn-block registerButton"
          >
            Register
          </button>
        </div>
        <!-- form-group// -->
        <p class="text-center">
          <a @click="goto('/forgot-password')" style="display:none" class="btn"
            >Forgot password?</a
          ><br />
        </p>
      </article>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loginError: "",
      loggingIn: false,
    };
  },
  methods: {
    goto(path) {
      this.$router.push({
        path: path,
      });
    },
    discordAuth() {
      var vm = this;
      fetch(`${vm.$root.$children[0].api_base_url}/discordauth`, {}).then(
        (res) => {
          res.json().then((data) => {
            if (data.success == false) {
              //
            } else {
              window.location.href = data.data;
            }
          });
        }
      );
    },
    auth() {
      var vm = this;
      vm.loggingIn = true;
      vm.loginError = "";
      fetch(`${vm.$root.$children[0].api_base_url}/auth`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          username: document.getElementById("loginUsername").value,
          password: document.getElementById("loginPassword").value,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            this.$root.$children[0].checkMessage(data);
            if (data.success == true) {
              vm.$root.$children[0].jwt = data.data.jwt;
              window.localStorage.setItem("jwt", data.data.jwt);
              fetch(`${vm.$root.$children[0].api_base_url}/@me`, {
                headers: {
                  Authorization: `Bearer ${data.data.jwt}`,
                },
              }).then((res) => {
                res.json().then((data) => {
                  this.$root.$children[0].checkMessage(data);
                  if (data.success == false) {
                    this.$router.push({
                      path: "/login",
                    });
                  } else {
                    this.$root.$children[0].user = data.data;
                    this.$root.$children[0].jwt = data.data.jwt;
                    vm.$router.push({
                      path: "/dashboard",
                    });
                  }
                });
                vm.loggingIn = false;
              });
            } else {
              vm.loginError = data.messages[0].humandFriendly;
              vm.loggingIn = false;
            }
          });
        })
        .catch(() => {
          this.$router.push({
            path: "/error",
          });
        });
    },
  },
};
</script>

<style scoped>
.loginCard {
  width: 375px;
  margin: 45px auto;
  margin-top: 50px;
  overflow: hidden;
}
.discordSignin,
.registerButton {
  width: 100%;
  margin-top: 10px;
}

@media only screen and (max-width: 1200px) {
  .loginCard {
    width: 50%;
  }
}

@media only screen and (max-width: 800px) {
  .loginCard {
    width: 99%;
  }
  .btn {
    width: 100%;
  }
}
</style>
