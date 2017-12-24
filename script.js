Vue.component('pos-table', {
	props: ['mats'],
	template: '#pos-table-template',
	filters: {
		formatIndex: function(val) {
			return (`${val.charAt(0).toUpperCase()}${val.slice(1)}`);
		},
		formatName: function(val) {
			return (`${val.charAt(0).toUpperCase()}${val.slice(1).replace('_', ' ')}`); 
		},
		formatLeft: function(val) {
			return (val < 0 ? 0 : val);
		}
	}
});
Vue.component('modal', {
	props: ['data'],
	template: '#modal-template',
	computed: {
		jsonData: function() {
			return (JSON.stringify(this.data));
		}
	}
});
var vm = new Vue({
	el: '#app',
	data: {
		loading: true,
		data: null,
		showModal: false
	},
	created: function() {
		this.fetchData();
	},
	methods: {
		merge: function(obj, obj2) {
			for (var key in obj2) {
				for (var key2 in obj2[key]) {
					obj[key][key2].have = obj2[key][key2].have;
				}
			}
			return obj;
		},
		fetchData: function() {
			var self = this;
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					self.data = JSON.parse(xhttp.responseText);
				}
			};
			xhttp.open('GET', 'data.json', true);
			xhttp.send();
			/*axios.all([
				axios.get('data.json'),
				axios.get('sample.json')
			])
			.then(axios.spread((need, sample) => {
				var data = this.merge(need.data, sample.data);
				this.loading = false;
				this.data = data;
			}));*/
		}
	}
});