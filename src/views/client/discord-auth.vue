<template>
  <div></div>
</template>

<script>
export default {
  mounted() {
    var vm = this;

    var token = vm.$route.query.code;
    var app = this.$root.$children[0];
    vm.$root.$children[0].is_verify_email = true;

    fetch(`${vm.$root.$children[0].api_base_url}/discordauthorize/${token}`)
      .then((res) => {
        res.json().then((data) => {
          this.$root.$children[0].checkMessage(data);
          if (data.success == false) {
            vm.$root.$children[0].is_verify_email = false;
            app.fetching_root = false;
            this.$router.push({
              path: "/login",
            });
          } else {
            var jwt = data.data;

            fetch(`${vm.$root.$children[0].api_base_url}/@me`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            }).then((res) => {
              res.json().then((data) => {
                window.localStorage.setItem("jwt", jwt);
                this.$root.$children[0].user = data.data;
                this.$root.$children[0].jwt = jwt;
                app.fetching_root = false;
                vm.$router.push({
                  path: "/dashboard",
                });
              });
            });
          }
        });
      })
      .catch(() => {
        this.$router.push({
          path: "/error",
        });
      });

    console.log(token);
  },
};
</script>
