<script>
import { Line } from "vue-chartjs";

export default {
  extends: Line,
  data: () => ({
    interval: null,
    netstate: 1,
    chartdata: {
      labels: [],
      datasets: [
        {
          pointRadius: 0,
          label: "CPU Usage (%)",
          backgroundColor: "#1976D2",
          borderColor: "#1976D2",
          data: [],
          fill: false,
        },
        {
          pointRadius: 0,
          label: "Network Out (KBytes/s)",
          backgroundColor: "#388E3C",
          borderColor: "#388E3C",
          data: [],
          fill: false,
        },
        {
          pointRadius: 0,
          label: "Network In (KBytes/s)",
          backgroundColor: "#D32F2F",
          borderColor: "#D32F2F",
          data: [],
          fill: false,
        },
      ],
    },
    options: {
      legend: {
        display: true,
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              display: false, //this will remove only the label
            },
            gridLines: {
              color: "rgba(0, 0, 0, 0)",
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              color: "rgba(0, 0, 0, 0)",
            },
          },
        ],
      },
    },
  }),
  props: ["uuid", "dataPoints"],

  mounted() {
    var vm = this;
    var toAppend = [];

    fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vm.uuid}/metrics`, {
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
      },
    }).then((res) => {
      res.json().then((data) => {
        if (data.success == true) {
          var vpsMetrics = data.data;

          vpsMetrics.reverse();

          for (var histItemIndex in vpsMetrics) {
            if (histItemIndex <= vm.dataPoints) {
              var histItem = vpsMetrics[histItemIndex];
              toAppend.push(histItem);
            }
          }

          toAppend.reverse();
          for (histItemIndex in toAppend) {
            histItem = toAppend[histItemIndex];
            vm.chartdata.datasets[0].data[histItemIndex] =
              histItem.data.cpu || 0;

            var time = histItem.time;
            var date = new Date();
            date.setTime(time);
            if (vm.netstate == 1) {
              vm.chartdata.datasets[1].data[histItemIndex] =
                histItem.data.netIn / 1000000;
              vm.chartdata.datasets[2].data[histItemIndex] =
                histItem.data.netOut / 1000000;
              vm.chartdata.datasets[1].label = "Network Out (MBytes/s)";
              vm.chartdata.datasets[2].label = "Network In (MBytes/s)";
            } else {
              vm.chartdata.datasets[1].data[histItemIndex] =
                histItem.data.netIn / 1000;
              vm.chartdata.datasets[2].data[histItemIndex] =
                histItem.data.netOut / 1000;
            }
            vm.chartdata.labels.push(vm.mysqlDate2(date));
          }

          vm.netAutoAdopt();

          vm.renderChart(vm.chartdata, vm.options);
          vm.interval = setInterval(() => {
            if (vm.server()) {
              if (vm.chartdata.datasets[0].data.length > vm.dataPoints) {
                vm.chartdata.datasets[0].data.splice(
                  0,
                  vm.chartdata.datasets[0].data.length - vm.dataPoints
                );
                vm.chartdata.datasets[1].data.splice(
                  0,
                  vm.chartdata.datasets[1].data.length - vm.dataPoints
                );
                vm.chartdata.datasets[2].data.splice(
                  0,
                  vm.chartdata.datasets[2].data.length - vm.dataPoints
                );
                vm.chartdata.labels.splice(
                  0,
                  vm.chartdata.labels.length - vm.dataPoints
                );
              }
              vm.addCpuData(vm.server().stats.cpu);
              if (vm.netstate == 1) {
                vm.addNetIn(vm.server().stats.netIn / 1000000);
                vm.addNetOut(vm.server().stats.netOut / 1000000);
              } else {
                vm.addNetIn(vm.server().stats.netIn / 1000);
                vm.addNetOut(vm.server().stats.netOut / 1000);
              }

              vm.chartdata.labels.push(vm.mysqlDate());
              vm.renderChart(vm.chartdata, vm.options);

              vm.netAutoAdopt();
            }
          }, 1000);
        }
      });
    });
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
  methods: {
    netAutoAdopt() {
      var vm = this;
      var highestValue = 0;
      for (var data of vm.chartdata.datasets[1].data) {
        if (data > highestValue) highestValue = data;
      }
      for (data of vm.chartdata.datasets[2].data) {
        if (data > highestValue) highestValue = data;
      }

      //mb
      if (vm.netstate == 1) {
        if (highestValue < 1) {
          vm.changeNetMode();
        }
      }
      //kb
      if (vm.netstate == 2) {
        if (highestValue > 500) {
          vm.changeNetMode();
        }
      }
    },
    mbtokb() {
      var vm = this;
      var netIn = [];
      var netOut = [];

      for (var data of vm.chartdata.datasets[1].data) {
        netIn.push(data * 1000);
      }
      for (data of vm.chartdata.datasets[2].data) {
        netOut.push(data * 1000);
      }
      vm.chartdata.datasets[1].data = netIn;
      vm.chartdata.datasets[2].data = netOut;
    },
    kbtomb() {
      var vm = this;
      var netIn = [];
      var netOut = [];

      for (var data of vm.chartdata.datasets[1].data) {
        netIn.push(data / 1000);
      }
      for (data of vm.chartdata.datasets[2].data) {
        netOut.push(data / 1000);
      }
      vm.chartdata.datasets[1].data = netIn;
      vm.chartdata.datasets[2].data = netOut;
    },
    changeNetMode() {
      var vm = this;
      if (vm.netstate == 1) {
        vm.mbtokb();
        vm.netstate = 2;
        vm.chartdata.datasets[1].label = "Network Out (KBytes/s)";
        vm.chartdata.datasets[2].label = "Network In (KBytes/s)";
      } else {
        vm.kbtomb();
        vm.chartdata.datasets[1].label = "Network Out (MBytes/s)";
        vm.chartdata.datasets[2].label = "Network In (MBytes/s)";
        vm.netstate = 1;
      }
      vm.renderChart(vm.chartdata, vm.options);
    },
    addCpuData(value) {
      var vm = this;
      if (value == null) value = 0;
      if (value < 0) value = 0;
      vm.chartdata.datasets[0].data.push(value);
    },
    addNetIn(value) {
      var vm = this;
      if (value < 0) value = 0;
      vm.chartdata.datasets[1].data.push(value);
    },
    addNetOut(value) {
      var vm = this;
      if (value < 0) value = 0;
      vm.chartdata.datasets[2].data.push(value);
    },
    mysqlDate() {
      var vm = this;
      var date = new Date();
      return (
        vm.twoDigits(date.getHours()) +
        ":" +
        vm.twoDigits(date.getMinutes()) +
        ":" +
        vm.twoDigits(date.getSeconds())
      );
    },
    mysqlDate2(date) {
      var vm = this;
      return (
        vm.twoDigits(date.getHours()) +
        ":" +
        vm.twoDigits(date.getMinutes()) +
        ":" +
        vm.twoDigits(date.getSeconds())
      );
    },
    twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    },
    server() {
      var vm = this;
      var vpsUuid = vm.uuid;

      if (vm.$root.$children[0].user) {
        var target = vm.$root.$children[0].user.vps.find((vps) => {
          return vps.uuid == vpsUuid;
        });

        if (!target) {
          //
        } else {
          return target;
        }
      }
      return;
    },
  },
};
</script>
