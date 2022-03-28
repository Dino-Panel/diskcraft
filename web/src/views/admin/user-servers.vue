<template>
  <div style="background-color: var(--bs-bg); color: var(--bs-text-default);">
    <section>
      <div class="CardArea">
        <serverInfoBlockVue
          v-for="(server, index) in $root.$children[0].user.servers.filter(
            (server) => server.owner == $route.params.user_id
          )"
          :key="index"
          :server="server"
        ></serverInfoBlockVue>

        <div
          class="card"
          v-if="
            $root.$children[0].user.servers.filter(
              (server) => server.owner == $route.params.user_id
            ).length < 1
          "
        >
          <div class="card-header">
            Servers
            <i
              data-v-f9d22df4=""
              class="fa-solid fa-wallet"
              style="float: right"
            ></i>
          </div>
          <div class="card-body">
            <p class="card-text">
              No servers found :(
              <br /><br />
              <router-link to="deploy" class="btn btn-primary"
                >Deploy a server</router-link
              >
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.CardArea {
  width: 95%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
</style>

<script>
import serverInfoBlockVue from "../../components/server-info-block.vue";

export default {
  components: {
    serverInfoBlockVue,
  },
  mounted() {
    var vm = this;
    this.refreshInterval = setInterval(() => {
      fetch(`${vm.$root.$children[0].api_base_url}/@me/servers`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      }).then((res) => {
        res.json().then((data) => {
          if (data.success == false) {
            //
          } else {
            this.$root.$children[0].user.servers = data.data;
          }
        });
      });
    }, 2000);
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
  },
  data() {
    return {
      refreshInterval: null,
      servers: [],
      pt_link: false,
      pt_link_change: true,
      loading: true,
      eventServer: {},
    };
  },
};
</script>
