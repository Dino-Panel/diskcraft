<template>
  <div style="background-color: var(--bs-bg); color: var(--bs-text-default);">
    <section>
      <div>
        <div
          class="CardArea"
          v-if="
            $root.$children[0].user.vps.filter(
              (vps) => vps.parent == $route.params.user_id
            ).length > 0
          "
        >
          <vpsInfoBlockVue
            v-for="(vpsInstance, index) of $root.$children[0].user.vps.filter(
              (vps) => vps.parent == $route.params.user_id
            )"
            :key="index"
            :vpsInstance="vpsInstance"
          ></vpsInfoBlockVue>
        </div>
        <div v-else><p class="horizontal-centered">No servers found :(</p></div>
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
.horizontal-centered {
  padding: 5px;
  width: 100%;
  text-align: center;
}
</style>

<script>
import vpsInfoBlockVue from "../../components/vps-info-block.vue";

export default {
  methods: {},
  mounted() {
    var vm = this;
    this.refresh = setInterval(() => {
      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      }).then((res) => {
        res.json().then((data) => {
          if (data.success == false) {
            //
          } else {
            this.$root.$children[0].user.vps = data.data;
          }
        });
      });
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.refresh);
  },
  data() {
    return {
      refresh: null,
    };
  },
  components: {
    vpsInfoBlockVue,
  },
};
</script>
