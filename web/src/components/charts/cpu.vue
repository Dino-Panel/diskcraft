<script>
import { Line } from "vue-chartjs";

export default {
  extends: Line,
  async mounted() {
    var vm = this;
    await vm.do_chart_setup();

    vm.interval = setInterval(() => {
      var cpu_data_points = vm.chartdata.datasets[0].data;

      cpu_data_points.push(vm.server().stats.cpu);
      vm.chartdata.labels.push(vm.mysqlDate());

      if (cpu_data_points.length > vm.dataPoints) {
        cpu_data_points.splice(0, cpu_data_points.length - vm.dataPoints);
        vm.chartdata.labels.splice(
          0,
          vm.chartdata.labels.length - vm.dataPoints
        );
      }

      vm.renderChart(vm.chartdata, vm.options);
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
  methods: {
    do_chart_setup() {
      var vm = this;
      var cpu_data_points = vm.chartdata.datasets[0].data;

      return new Promise((res) => {
        fetch(
          `${vm.$root.$children[0].api_base_url}/@me/vps/${vm.uuid}/metrics?type=cpu`,
          {
            headers: {
              Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
            },
          }
        ).then((resp) => {
          resp.json().then((data) => {
            var data_point_list = [];
            var i = 0;

            for (var data_point of data.data.reverse()) {
              if (i < vm.dataPoints) {
                data_point_list.push(data_point);
              }
              i++;
            }

            for (data_point of data_point_list.reverse()) {
              var time = data_point.time;
              var date = new Date();
              date.setTime(time);
              cpu_data_points.push(data_point.data.cpu);
              vm.chartdata.labels.push(vm.mysqlDate2(date));
            }

            console.log(data_point_list.length);

            vm.renderChart(vm.chartdata, vm.options);

            res();
          });
        });
      });
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
  data: () => ({
    interval: null,
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
      ],
    },
    options: {
      title: {
        display: true,
        text: "CPU",
        fontColor: "white",
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      yAxes: [
        {
          display: true,
          ticks: {
            beginAtZero: true,
            suggestedMax: 100,
            suggestedMin: 0,
            max: 100,
            min: 0,
          },
        },
      ],
      tooltip: {
        intersect: true,
      },
    },
  }),
  props: ["uuid", "dataPoints"],
};
</script>
