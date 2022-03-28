<template>
  <div class="card">
    <div class="card-header" style="padding-left: 10px">
      Chart
    </div>
    <cpu-chart :uuid="server().uuid" dataPoints="300"></cpu-chart>
  </div>
</template>

<script>
import cpuChart from "../../components/vpsChart.vue";
export default {
  components: {
    cpuChart,
  },
  methods: {
    server() {
      var vm = this;
      var vpsUuid = vm.$route.params.vps_uuid;

      if (vm.$root.$children[0].user) {
        var target = vm.$root.$children[0].user.vps.find((vps) => {
          return vps.uuid == vpsUuid;
        });

        if (!target) {
          this.$router.push({
            path: "/vps-manager",
          });
        } else {
          return target;
        }
      }
      return;
    },
  },
};
</script>

<style scoped>
.isoMountBtn {
  width: 120px;
}
.monitor_frame {
  width: 100%;
  height: 800px;
}
.poweraction_btn {
  width: 40px !important;
  height: 40px !important;
  margin: 5px;
}
.CardArea {
  width: 98%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea .card {
  background-color: var(--bs-card-bg);
  width: 100%;
  margin: 5px;
  flex-grow: 1;
  color: var(--bs-text-default);
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header-bg);
}
.btn-group {
  width: 100%;
}
</style>
