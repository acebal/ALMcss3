ALMCSS.collections = function() {

	var List = function(elements) {
		this.elements = elements;
	};

	List.prototype.indexOf = function(item, from) {
		from = from || 0;
		if (Array.prototype.indexOf) {
			return this.elements.indexOf(item, from);
		}
		for (var i = 0; i < this.elements.length; i++) {
			if (this.elements[i] === item) {
				return i;
			}
		}
		return -1;
	};

	List.prototype.contains = function(item) {
		return this.indexOf(item) != -1;
	};

	return {
		List: List
	};

}();