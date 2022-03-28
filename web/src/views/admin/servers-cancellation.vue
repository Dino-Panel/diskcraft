<template>
  <div style=" color: var(--bs-text-default);">
    <section>
      <div class="CardArea">
        <serverInfoBlockVue
          v-for="(server, index) in $root.$children[0].user.servers.filter(
            (server) => server.renew == false
          )"
          :key="index"
          :server="server"
          :cancel_now="true"
        ></serverInfoBlockVue>

        <div
          class="card"
          v-if="
            $root.$children[0].user.servers.filter(
              (server) => server.renew == false
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
              No servers found! :)
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.CardArea {
  width: 100%;
  max-width: 1900px;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.card-header p {
  margin-bottom: 0px;
  line-height: 28px;
  margin-left: 5px;
  color: var(--bs-text-default);
}
.card-header .fad {
  font-size: 20px;
}
.card {
  background-color: var(--bs-card-bg);
  width: 100%;
  margin: 5px;
  flex-grow: 1;
}
.card .card-header {
  background-color: var(--bs-card-header);
}

@media only screen and (max-width: 1200px) {
  .CardArea {
    width: 100%;
  }
}

@media only screen and (max-width: 800px) {
  .CardArea {
    width: 100%;
  }
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
