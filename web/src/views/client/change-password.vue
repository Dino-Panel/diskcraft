<template>
  <div>
    <div class="CardArea">
      <div class="card">
        <div class="card-header">
          New password
        </div>
        <div class="card-body">
          <h5 class="card-title">Enter new password</h5>
          <p
            v-for="(error, index) in passwordErrors"
            :key="index"
            class="text-danger text-center"
          >
            {{ error.humandFriendly }}
          </p>
          <p
            v-for="(msg, index) in messages"
            :key="index"
            class="text-success text-center"
          >
            {{ msg.humandFriendly }}
          </p>
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1"
              ><i class="fa fa-lock"></i
            ></span>
            <input
              id="newPassword"
              type="password"
              class="form-control"
              placeholder="Password"
              aria-label="Password"
              aria-describedby="basic-addon1"
            />
          </div>
          <p class="card-text">
            <button @click="updatePassword()" class="btn btn-primary">
              Update Password
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.CardArea {
  width: 90%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea .card {
  color: var(--bs-text-default);
  background-color: var(--bs-card-bg);
  width: 400px;
  margin: 5px;
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header-bg);
}
</style>

<script>
export default {
  data() {
    return {
      passwordErrors: [],
      messages: [],
    };
  },
  methods: {
    updatePassword() {
      var vm = this;
      fetch(`${vm.$root.$children[0].api_base_url}/@me/changepassword`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          newPassword: document.getElementById("newPassword").value,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
          if (data.success == false) {
            return;
          }
          window.localStorage.clear();
          vm.$root.$children[0].user = null;
          this.$router.push({
            path: "/login",
          });
        });
      });
    },
  },
};
</script>
