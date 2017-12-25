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
Vue.component('export', {
	props: ['data'],
	template: '#export-template',
	computed: {
		jsonData: function() {
			return (JSON.stringify(this.data));
		}
	}
});
Vue.component('import', {
	props: ['value'],
	template: '#import-template',
	data: function() {
		return {
			error: null
		}
	},
	methods: {
		isJson: function(val) {
			try {
				val = JSON.parse(val);
			} catch (e) {
				return (false);
			}
			if (typeof val === 'object' && val !== null) {
				return (true);
			}
			return (false);
		},
		importData: function() {
			if (this.isJson(this.value)) {
				this.error = '';
				this.$emit('input', this.value);
				this.$emit('close');
			} else {
				this.error = 'Invalid json';
			}
		}
	}
});
var vm = new Vue({
	el: '#app',
	data: {
		base: null,
		data: null,
		importedData: null,
		showExport: false,
		showImport: false
	},
	created: function() {
		this.fetchData();
	},
	watch: {
		data: {
			handler: function(val) {
				localStorage.setItem('dsPosData', JSON.stringify(val));
			},
			deep: true
		},
		importedData: async function(val) {
			this.data = await this.merge(this.base, val);
		}
	},
	methods: {
		merge: async function(obj, obj2) {
			if (typeof obj !== 'object') obj = await JSON.parse(obj);
			if (typeof obj2 !== 'object') obj2 = await JSON.parse(obj2);
			for (var key in obj2) {
				for (var key2 in obj2[key]) {
					if (obj2[key][key2].have) {
						obj[key][key2].have = obj2[key][key2].have;
					}
				}
			}
			return obj;
		},
		fetchData: function() {
			var userData = localStorage.getItem('dsPosData');
			var self = this;
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = async function() {
				if (this.readyState == 4 && this.status == 200) {
					self.base = xhttp.responseText;
					if (userData) self.data = await self.merge(xhttp.responseText, userData);
					else self.data = JSON.parse(xhttp.responseText);
				}
			};
			xhttp.open('GET', 'data.json', true);
			xhttp.send();
		}
	}
});