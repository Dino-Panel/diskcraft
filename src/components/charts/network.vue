<script>
import { Line } from "vue-chartjs";

export default {
  extends: Line,
  async mounted() {
    var vm = this;
    await vm.do_chart_setup();

    vm.interval = setInterval(async () => {
      var netIn_points = vm.chartdata.datasets[0].data;
      var netOut_points = vm.chartdata.datasets[1].data;

      if (vm.current_scale == 0) {
        netOut_points.push(vm.server().stats.netOut / 100);
        netIn_points.push(vm.server().stats.netIn / 100);
      } else {
        netOut_points.push(vm.server().stats.netOut / 100000);
        netIn_points.push(vm.server().stats.netIn / 100000);
      }
      vm.chartdata.labels.push(vm.mysqlDate());

      if (
        netOut_points.length > vm.dataPoints ||
        netIn_points.length > vm.dataPoints
      ) {
        netIn_points.splice(0, netIn_points.length - vm.dataPoints);
        netOut_points.splice(0, netOut_points.length - vm.dataPoints);
        vm.chartdata.labels.splice(
          0,
          vm.chartdata.labels.length - vm.dataPoints
        );
      }

      await vm.do_chart_scale_check();
      vm.renderChart(vm.chartdata, vm.options);
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
  methods: {
    do_chart_scale_check() {
      return new Promise((res) => {
        var vm = this;
        var netIn_points = vm.chartdata.datasets[0].data;
        var netOut_points = vm.chartdata.datasets[1].data;

        var upper_scale_activate = 900;
        var upper_scale_deactivate = 0.5; //must be in new scale

        var highest_item = 0;

        //check for activate value

        if (vm.current_scale == 0) {
          for (var data_point of netIn_points) {
            if (highest_item < data_point) highest_item = data_point;
          }
          for (data_point of netOut_points) {
            if (highest_item < data_point) highest_item = data_point;
          }

          if (highest_item >= upper_scale_activate) {
            vm.switch_to_high_scale();
            vm.chartdata.datasets[0].label = "Network In (MBit/s)";
            vm.chartdata.datasets[1].label = "Network Out (Mbit/s)";
            vm.current_scale = 1;
          }
        }

        if (vm.current_scale == 1) {
          for (data_point of netIn_points) {
            if (highest_item < data_point) highest_item = data_point;
          }
          for (data_point of netOut_points) {
            if (highest_item < data_point) highest_item = data_point;
          }

          if (highest_item <= upper_scale_deactivate) {
            vm.switch_to_low_scale();
            vm.chartdata.datasets[0].label = "Network In (Kbit/s)";
            vm.chartdata.datasets[1].label = "Network Out (Kbit/s)";
            vm.current_scale = 0;
          }
        }

        res();
      });
    },
    switch_to_high_scale() {
      var vm = this;
      var netIn_points = vm.chartdata.datasets[0].data;
      var netOut_points = vm.chartdata.datasets[1].data;

      var new_netIn = [];
      var new_netOut = [];

      for (var data_point of netIn_points) {
        new_netIn.push(data_point / 1000);
      }
      for (data_point of netOut_points) {
        new_netOut.push(data_point / 1000);
      }

      vm.chartdata.datasets[0].data = new_netIn;
      vm.chartdata.datasets[1].data = new_netOut;
    },
    switch_to_low_scale() {
      var vm = this;
      var netIn_points = vm.chartdata.datasets[0].data;
      var netOut_points = vm.chartdata.datasets[1].data;

      var new_netIn = [];
      var new_netOut = [];

      for (var data_point of netIn_points) {
        new_netIn.push(data_point * 1000);
      }
      for (data_point of netOut_points) {
        new_netOut.push(data_point * 1000);
      }

      vm.chartdata.datasets[0].data = new_netIn;
      vm.chartdata.datasets[1].data = new_netOut;
    },
    do_chart_setup() {
      var vm = this;
      var netIn_points = vm.chartdata.datasets[0].data;
      var netOut_points = vm.chartdata.datasets[1].data;

      return new Promise((res) => {
        fetch(
          `${vm.$root.$children[0].api_base_url}/@me/vps/${vm.uuid}/metrics?type=network`,
          {
            headers: {
              Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
            },
          }
        ).then((resp) => {
          resp.json().then(async (data) => {
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
              netIn_points.push(data_point.data.netIn / 100);
              netOut_points.push(data_point.data.netOut / 100);
              vm.chartdata.labels.push(vm.mysqlDate2(date));
            }

            await vm.do_chart_scale_check();

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
    current_scale: 0,

    chartdata: {
      labels: [],
      datasets: [
        {
          pointRadius: 0,
          label: "Network In (KBit/s)",
          backgroundColor: "#388E3C",
          borderColor: "#388E3C",
          data: [],
          fill: false,
        },
        {
          pointRadius: 0,
          label: "Network Out (KBit/s)",
          backgroundColor: "#D32F2F",
          borderColor: "#D32F2F",
          data: [],
          fill: false,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Network IO",
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
