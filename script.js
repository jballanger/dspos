Vue.component('table-filters', {
	props: ['filters'],
	template: '#table-filters-template',
	data: function() {
		return {
			parts: ['weapon', 'head', 'top', 'bottom', 'gloves', 'shoes', 'shoulder', 'wings']
		}
	},
	filters: {
		formatLabel: function(val) {
			return (`${val.charAt(0).toUpperCase()}${val.slice(1)}`);
		},
		formatId: function(val) {
			return (`${val}_check`);
		}
	}
});
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
		showImport: false,
		showFilters: false,
		filters: {
			want: {'weapon': true, 'head': true, 'top': true, 'bottom': true, 'gloves': true, 'shoes': true, 'shoulder': true, 'wings': true},
			have: {}
		}
	},
	created: function() {
		this.fetchData();
	},
	computed: {
		exportData: function() {
			return ({'data': this.data, 'filters': this.filters});
		}
	},
	watch: {
		data: {
			handler: function(val) {
				localStorage.setItem('dsPosData', JSON.stringify(val));
			},
			deep: true
		},
		filters: {
			handler: async function(val) {
				localStorage.setItem('dsPosFilters', JSON.stringify(val));
				this.data = await this.build(this.base);
			},
			deep: true
		},
		importedData: async function(val) {
			let tmp = JSON.parse(val);
			if (tmp.filters && tmp.data) {
				this.filters = tmp.filters;
				this.data = await this.merge(this.data, tmp.data);
			} else {
				await this.merge(this.data, tmp);
			}
		}
	},
	methods: {
		build: async function(obj) {
			if (typeof obj !== 'object') obj = await JSON.parse(obj);
			var build = {};
			Object.keys(obj).forEach(part => {
				Object.keys(obj[part]).forEach(rarity => {	
					Object.keys(obj[part][rarity]).forEach(mat => {
						let index = mat.split('.');
						if (!build[index[0]]) build[index[0]] = {};
						if (!build[index[0]][index[1]]) {
							build[index[0]][index[1]] = {};
							build[index[0]][index[1]].need = 0;
							build[index[0]][index[1]].have = (this.data) ? (this.data[index[0]][index[1]].have) : 0;
						}
						if (this.filters.want[part] && (!this.filters.have[part] || this.filters.have[part] < rarity)) {
							build[index[0]][index[1]].need += obj[part][rarity][mat];
						}
					});
				});
			});
			return (build);
		},
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
			var self = this;
			var user = {
				'data': localStorage.getItem('dsPosData'),
				'filters': localStorage.getItem('dsPosFilters')
			};
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = async function() {
				if (this.readyState == 4 && this.status == 200) {
					self.base = await JSON.parse(xhttp.responseText);
					if (user.filters) self.filters = await JSON.parse(user.filters);
					let tmpData = await self.build(xhttp.responseText);
					if (user.data) self.data = await self.merge(tmpData, user.data);
					else self.data = tmpData;
				}
			};
			xhttp.open('GET', 'data.json', true);
			xhttp.send();
		}
	}
});