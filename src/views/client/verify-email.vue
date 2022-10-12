<template>
  <div></div>
</template>

<script>
export default {
  mounted() {
    var vm = this;

    var token = vm.$route.query.code;
    //var app = this.$root.$children[0];
    vm.$root.$children[0].is_verify_email = true;
    console.log(token);

    fetch(`${vm.$root.$children[0].api_base_url}/activate`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({
        code: token,
      }),
    }).then((resp) => {
      resp.json().then((data) => {
        this.$root.$children[0].checkMessage(data);
        this.$root.$children[0].fetching_root = false;
        this.$router.push({
          path: "/login",
        });
        console.log(data);
      });
    });
  },
};
</script>
