module.exports = {
	ConvertToWeekDHIS(date){
		date= (date==undefined?new Date():new Date(date))
		var i=0,f,sem=(new Date(date.getFullYear(), 0,1).getDay()>0)?1:0;
		while( (f=new Date(date.getFullYear(), 0, ++i)) < date ){
			if(!f.getDay()){
				sem++;
			}
		}
		return date.getFullYear()+"W"+sem;
	}
}
