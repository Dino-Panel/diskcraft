<template>
  <div style="background-color: #283643">
    <div class="card loginCard">
      <article class="card-body">
        <h4 class="card-title text-center mb-4 mt-1">
          Register
        </h4>
        <hr />
        <p v-if="loginError" class="text-danger text-center">
          {{ loginError }}
        </p>
        <div class="form-group">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i class="fa-solid fa-user"></i>
              </span>
            </div>
            <input
              id="registerUsername"
              name=""
              class="form-control"
              placeholder="Username"
              type="text"
            />
          </div>
          <!-- input-group.// -->
        </div>
        <br />
        <div class="form-group">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i class="fa-solid fa-envelope"></i>
              </span>
            </div>
            <input
              id="registerEmail"
              name=""
              class="form-control"
              placeholder="Email"
              type="email"
            />
          </div>
          <!-- input-group.// -->
        </div>
        <br />

        <div class="form-group">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i class="fa-solid fa-comment-text"></i>
              </span>
            </div>
            <input
              id="registerFirstName"
              name=""
              class="form-control"
              placeholder="First name"
              type="text"
            />
          </div>
          <!-- input-group.// -->
        </div>
        <br />
        <div class="form-group">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text">
                <i class="fa-solid fa-signature"></i>
              </span>
            </div>
            <input
              id="registerLastName"
              name=""
              class="form-control"
              placeholder="Last name"
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
                <i class="fa fa-lock"></i>
              </span>
            </div>
            <input
              id="registerPassword"
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
          <button @click="auth()" class="btn btn-primary btn-block">
            Register
          </button>
        </div>
        <!-- form-group// -->
        <p class="text-center">
          <a href="/login" class="btn">Sign in</a>
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
    };
  },
  methods: {
    auth() {
      var vm = this;
      vm.loginError = "";
      fetch(`${vm.$root.$children[0].api_base_url}/register`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          username: document.getElementById("registerUsername").value,
          password: document.getElementById("registerPassword").value,
          email: document.getElementById("registerEmail").value,
          first_name: document.getElementById("registerFirstName").value,
          last_name: document.getElementById("registerLastName").value,
        }),
      })
        .then((res) => {
          console.log(res);
          res.json().then((data) => {
            this.$root.$children[0].checkMessage(data);
            if (data.success == true) {
              vm.$router.push({
                path: "/login",
              });
            } else {
              vm.loginError = data.messages[0].humandFriendly;
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
</style>
