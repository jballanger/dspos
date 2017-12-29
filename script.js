Vue.component('table-filters', {
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
	},
	methods: {
		filter: function(val) {
			this.$emit('filter', ['want', val]);
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
			want: [],
			have: []
		}
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
		filter: function(val) {
			var part = val[1];
			if (val[0] === 'want') {
				let filtersIndex = this.filters.want.indexOf(part);
				if (filtersIndex !== -1) this.filters.want.splice(filtersIndex, 1);
				else this.filters.want.push(part);
				Object.keys(this.base[part]).forEach(rarity => {
					Object.keys(this.base[part][rarity]).forEach(mat => {
						let index = mat.split('.');
						if (filtersIndex !== -1) this.data[index[0]][index[1]].need += this.base[part][rarity][mat];
						else this.data[index[0]][index[1]].need -= this.base[part][rarity][mat];
					});
				});
			} else if (val [0] === 'have') {
				console.log('have filter');
			}
		},
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
							build[index[0]][index[1]].have = 0;
						}
						build[index[0]][index[1]].need += obj[part][rarity][mat];
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
			var userData = localStorage.getItem('dsPosData');
			var self = this;
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = async function() {
				if (this.readyState == 4 && this.status == 200) {
					self.base = await JSON.parse(xhttp.responseText);
					self.data = await self.build(xhttp.responseText);
					//console.log(self.base);
					/*self.base = xhttp.responseText;
					if (userData) self.data = await self.merge(xhttp.responseText, userData);
					else self.data = JSON.parse(xhttp.responseText);*/
				}
			};
			xhttp.open('GET', 'data2.json', true);
			xhttp.send();
		}
	}
});