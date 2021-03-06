// Global variables go here.
var matrix; //main svg
var matrix_data = {
    topicids: "",
    docids: "",
    weights:""
}; //holds data to render matrix read from csv

var new_data = {};
//variable to store react functions and callbacks
var globalfns;
var x,y;

var dimensions = {
    grid_size: 30,
    w_width: 1200,
    w_height: 1200,
    margin: {
        top: 150,
        right: 50,
        bottom: 50,
        left: 500
    },
    width: function(){
        return this.w_width - (this.margin.left + this.margin.right)
    },

    height: function(){
        return this.w_height - (this.margin.top + this.margin.bottom)
    }
}

//remember the position of the elem being dragged
var dragging = {};

var top_matrix = [],doc_matrix = [];
var top_nodes = [];
var doc_nodes = [];
var t_cnt = 0;
var d_cnt = 0;
var t_nodes=[], d_nodes=[];

var top_orders = {};
var doc_orders = {};


var sel_topics = [];
var sel_docs = [];
var read_data = function(){
    d3.csv("../Datamodel/Metadata/"+localStorage.getItem('dataset')+"/TopicModel/theta.csv", function(error, data) {
        // console.log("in callback");
        var topicids = [];
        var docids = [];
        var weights = [];

        data.map(function(row){
            //read topic names
            if(topicids.length == 0){
                for(var k in row) topicids.push(k);
                topicids.shift();  //removes first element
                // console.log("i should only get called once");
            }

            //read document names
            docids.push(row.Document);

            //read data
            var row_data = [];
            for(var k in row) row_data.push(row[k]);
            row_data.shift();
            weights.push(row_data);
        });

        matrix_data["docids"] = docids;
        matrix_data["topicids"] = topicids;
        matrix_data["weights"] = weights;

        // console.log("final matrix", matrix_data);

        // // Dummy data
        // matrix_data["docids"] = ["a", "b", "c", "d", "e", "f", "a", "b", "c", "d", "e", "f", "a", "b", "c", "d", "e", "f", "a", "b", "c", "d", "e", "f"];
        // matrix_data["topicids"] = ["1", "2", "3", "4", "5", "1", "2", "3", "4", "5"];
        // matrix_data["weights"] = [["1","2","3","4","5", "1","2","3","4","5"],["2","3","4","5","1", "2","3","4","5","1"],["3","4","5","1","2", "3","4","5","1","2"],["4","5","1","2","3", "4","5","1","2","3"],["5","4","3","2","1", "5","4","3","2","1"], ["1","3","2","5","4", "1","3","2","5","4"], ["1","2","3","4","5", "1","2","3","4","5"],["2","3","4","5","1", "2","3","4","5","1"],["3","4","5","1","2", "3","4","5","1","2"],["4","5","1","2","3", "4","5","1","2","3"],["5","4","3","2","1", "5","4","3","2","1"], ["1","3","2","5","4", "1","3","2","5","4"], ["1","2","3","4","5", "1","2","3","4","5"],["2","3","4","5","1", "2","3","4","5","1"],["3","4","5","1","2", "3","4","5","1","2"],["4","5","1","2","3", "4","5","1","2","3"],["5","4","3","2","1", "5","4","3","2","1"], ["1","3","2","5","4", "1","3","2","5","4"], ["1","2","3","4","5", "1","2","3","4","5"],["2","3","4","5","1", "2","3","4","5","1"],["3","4","5","1","2", "3","4","5","1","2"],["4","5","1","2","3", "4","5","1","2","3"],["5","4","3","2","1", "5","4","3","2","1"], ["1","3","2","5","4", "1","3","2","5","4"]];
        // console.log("dummy matrix", matrix_data);
        dimensions.w_width = (dimensions.grid_size-1) * matrix_data["weights"][0].length;
        dimensions.w_height = (dimensions.grid_size-2) * matrix_data["weights"].length;
        // console.log(dimensions);
        init();
        draw_matrix(matrix_data);
    })
};

function init(){
    let i;
    y = d3.scale.ordinal().rangeBands([0, dimensions.w_height],0,1);
    x = d3.scale.ordinal().rangeBands([0, dimensions.w_width],0,1);

    top_nodes = matrix_data.topicids;
    doc_nodes = matrix_data.docids;
    t_cnt = top_nodes.length;
    d_cnt = doc_nodes.length;
    var weights = matrix_data.weights;
    // get sort order for names
    top_orders.name = d3.range(t_cnt).sort(function(a, b) { return d3.ascending(top_nodes[a], top_nodes[b]); });
    doc_orders.name = d3.range(d_cnt).sort(function(a, b) { return d3.ascending(doc_nodes[a], doc_nodes[b]); });

    // get two matrix representations
    // Topics
    let top_matrix = [],doc_matrix = [];
    for(i = 0; i<matrix_data.topicids.length; i++){
        top_matrix[i] = d3.range(d_cnt).map((j) => {return matrix_data["weights"][j][i]});
    }
    // Documents
    for(i = 0; i<matrix_data.docids.length; i++){
        doc_matrix[i] = d3.range(t_cnt).map((j) => {return matrix_data["weights"][i][j]});
    }
    // get sort order for values
    top_orders.sort = {"max":[], "min":[]};
    doc_orders.sort = {"max":[], "min":[]};
    // Topics
    var doc_means = d3.range(t_cnt).sort(function(a, b) { return d3.ascending(doc_matrix[a], doc_matrix[b])});
    for(i = 0; i<matrix_data.docids.length; i++){
        var temp = doc_matrix[i];
        top_orders.sort.max[i] = d3.range(t_cnt).sort(function(a, b) { return temp[b] - temp[a]; });
        top_orders.sort.min[i] = top_orders.sort.max[i].slice().reverse();
    }
    // Documents
    for(i = 0; i<matrix_data.topicids.length; i++){
        var temp = top_matrix[i];
        doc_orders.sort.max[i] = d3.range(d_cnt).sort(function(a, b) { return temp[b] - temp[a]; });
        doc_orders.sort.min[i] = doc_orders.sort.max[i].slice().reverse();
    }
}

function draw_matrix(data){
    new_data = data;
    // clean the slate before drawing
    d3.select("#matrix").remove();
    matrix = d3.select("#matrix_canvas")
        .attr("width", dimensions.w_width+dimensions.margin.left+dimensions.margin.right)
        .attr("height", dimensions.w_height+dimensions.margin.top+dimensions.margin.bottom)
        .append("g")
        .attr("id", "matrix")
        .attr("transform", "translate(" + (dimensions.margin.left) + "," + dimensions.margin.top + ")");

    // Maintain two matrix for doc view and topic view drag
    top_matrix = [], doc_matrix = [];
    top_nodes = data.topicids;
    doc_nodes = data.docids;
    t_cnt = top_nodes.length;
    d_cnt = doc_nodes.length;
    t_nodes=[], d_nodes=[];


    //Topic names
    for(var i=0; i<t_cnt; i++){
        t_nodes.push({"name": top_nodes[i]});
    }
    //Document names
    for(var i=0; i<d_cnt; i++){
        d_nodes.push({"name": doc_nodes[i]});
    }

    t_nodes.forEach(function(node, i) {
        node.index = i;
        top_matrix[i] = d3.range(d_cnt).map((j) => {
            return {x: j, y: i, z: scale_radius(data["weights"][j][i], 0, 5)};
        });
    });

    d_nodes.forEach(function(node, i) {
        node.index = i;
        doc_matrix[i] = d3.range(t_cnt).map((j) => {
            return {x: i, y: j, z: scale_radius(data["weights"][i][j], 0, 5)};
        });
    });

    top_orders.id = d3.range(t_cnt);
    doc_orders.id = d3.range(d_cnt);

    // console.log(top_orders, doc_orders);

    // console.log(doc_orders, top_orders)

    // The default sort order.
    y.domain(doc_orders.id);
    x.domain(top_orders.id);

    var row = matrix.selectAll(".row")
        .data(doc_matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("row_id", function(d, i){return "row_"+i;})
        .attr("transform", function(d, i) {
            return "translate(0," + y(i) + ")"; })
        .each(row_fn);

    var column = matrix.selectAll(".column")
        .data(top_matrix)
        .enter().append("g")
        .attr("class", "column")
        .attr("col_id", function(d, i){return "col_"+i;})
        .attr("transform", function(d, i) {
            return "translate(" + x(i) + ")rotate(-90)"; })
        .each(column_fn);

    var gbox = matrix.selectAll(".gbox")
        .data(Array(data["weights"][0].length).fill().map(() => Array(data["weights"].length).fill(0)))
        .enter().append("g")
        .attr("class", "gbox")
        .attr("col_id", function(d, i){return "grd_col_"+i;})
        .attr("transform", function(d, i) {
            return "translate(" + (x(i) - dimensions.grid_size/2) + ", "+ (-dimensions.grid_size/2)+")"; })
        .each(gbox_fn);

    var trigger;

    var startX = 0, startY = 0;
    var endX = 0, endY = 0;
    d3.selectAll(".row").on("click", function(d){
        globalfns.handleDocumentChange((d3.event.target.id).toString().replace(/ /g, ''));
        if (sel_docs.indexOf(d3.event.target.id).toString() == -1) {
            sel_docs.push((d3.event.target.id).toString());
        }
        d3.select(this).select("rect")
            .attr("opacity", 1);
        d3.select(this).select("text")
            .attr("fill", "#fff")
            .style("font-weight", "bolder")

        // add to selection box
        document.getElementById('selecteddocslist').innerHTML = "";
        for(var i=0; i<sel_docs.length; i++){
            document.getElementById('selecteddocslist').innerHTML += sel_docs[i]+"<br/>";
        }
    });
    d3.selectAll(".row").on("dblclick", function(d, i){
        console.log("sort by row", i);
        var order = d3.range(doc_matrix[i].length).sort(function(a, b){ return doc_matrix[i][b].z - doc_matrix[i][a].z});
        // var order = top_orders.sort.max[i];
        //console.log("orders", orders, "order", order);
        // hide topic matrix
        d3.selectAll(".cellrow").attr("opacity", 0);
        d3.selectAll(".cellcolumn").attr("opacity", 1);
        sort_animate(order, "topic");
        updateMatrixAndRedraw(data, order, "top");
    });
    d3.selectAll(".row").call(d3.behavior.drag()
        .origin(function(d) { 
            return {y: y(d[0].x)}; 
        })
        .on("dragstart", function(d) {
            trigger = d3.event.sourceEvent.target.className.baseVal;
            [startX, startY] = d3.mouse(this);
            if (trigger == "labels") {
                d3.selectAll(".cellrow").attr("opacity", 1);
                dragging[d[0].x] = y(d[0].x);
                var sel = d3.select(this);
                sel.moveToFront();
            }
        })
        .on("drag", function(d) {
            if (trigger == "labels") {
                d3.selectAll(".cellcolumn").attr("opacity", 0);
                dragging[d[0].x] = Math.min(dimensions.w_height, Math.max(0, d3.event.y));
                doc_orders.id.sort(function(a, b) { return position(a) - position(b); });
                y.domain(doc_orders.id);
                d3.selectAll(".row").attr("transform", function(d) {
                    if(d)
                        return "translate(0," + position(d[0].x) + ")";
                });
            }
        })
        .on("dragend", function(d) {
            if (trigger == "labels") {
                delete dragging[d[0].x];
                transition(d3.select(this)).attr("transform", "translate(0," + y(d[0].x) + ")");
                d3.selectAll(".column").each(function(d) {
                    d3.select(this).selectAll(".cellcolumn").attr("x", function(d) {
                        return -y(d.x); });
                });
                [endX, endY] = d3.mouse(this);
                if(Math.abs(startY-endY) > 0){
                    console.log("updating vie")
                    updateMatrixAndRedraw(data, doc_orders.id, 'left');
                }
            }
        })
    );

    row.append("rect").attr("width", function(d, i) {return 8* d_nodes[i].name.length;})
        .attr("height","20px")
        .attr("x", function(d, i) {return -8* d_nodes[i].name.length + 16;})
        .attr("y", "-10px")
        .attr("opacity", function(d, i){
            if (sel_docs.indexOf(d_nodes[i].name) > -1) {
                return 1;
            }else{
                return 0;
            }
        });
    row.append("text")
        .attr("class", "labels")
        .attr("x", 10)
        .attr("y", 0)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text(function(d, i) { return d_nodes[i].name; })
        .attr("fill", function(d, i){
            if (sel_docs.indexOf(d_nodes[i].name) > -1) {
                return "#fff";
            }
        })
        .style("font-weight", function(d, i){
            if (sel_docs.indexOf(d_nodes[i].name) > -1) {
                return "bolder";
            }
        })
    row.append("text")
        .attr("class","sorter")
        .attr("x", function(d, i) {return -8* d_nodes[i].name.length - 8;})
        .attr("dy", ".32em")
        .text("|-->")
        .attr("id", function(d, i) { return d_nodes[i].name; })   //Fix added by Pranay on 19-Nov-2018 for incorrect topic view issue;

    d3.selectAll(".column").on("dblclick", function(d, i){
        console.log("sort by column", i);
        var order = d3.range(top_matrix[i].length).sort(function(a, b){ return top_matrix[i][b].z - top_matrix[i][a].z});
        //var order = doc_orders.sort.max[i];
        // hide topic matrix
        d3.selectAll(".cellcolumn").attr("opacity", 0);
        d3.selectAll(".cellrow").attr("opacity", 1);
        sort_animate(order, "document");
        var curr = d3.select(this);
        var initX = (curr.attr('init-cx')*1);
        var currX = (curr.attr('cx')*1);
        var initY = (curr.attr('init-cy')*1);
        var currY = (curr.attr('cy')*1);
        if(((currX) <= (initX+20)) && ((currY) <= (initY+20))) {
            console.log("updating view");
            updateMatrixAndRedraw(data, order, "left");
        }
    });
    // Define drag behaviour
    d3.selectAll(".column").on("click", function(d){
        console.log("updating topic view bar chart");
        globalfns.handleTopicChange(/*d[0].y*/(d3.event.target.id).toString().replace("Topic","")); //Changing argument to get current topic_name for topic view issue
        if (sel_topics.indexOf(d3.event.target.id).toString() == -1) {
            sel_topics.push(d3.event.target.id.toString());
        }
        //make highlighted
        d3.select(this).select("rect")
            .attr("opacity", 1);
        d3.select(this).select("text")
            .attr("fill", "#fff")
            .style("font-weight", "bolder");

        // add to selection box
        document.getElementById('selectedtopicslist').innerHTML = "";
        for(var i=0; i<sel_topics.length; i++){
            document.getElementById('selectedtopicslist').innerHTML += sel_topics[i]+"<br/>";
        }
    })
        .call(d3.behavior.drag()
        .origin(function(d) {
            return {x: x(d[0].y)}; 
        })
        .on("dragstart", function(d) {
            // console.log("in dragstart", d);
            [startX, startY] = d3.mouse(this);
            trigger = d3.event.sourceEvent.target.className.baseVal;
            console.log("im getting dragged");
            if (trigger == "labels") {
                d3.selectAll(".cellcolumn").attr("opacity", 1);
                dragging[d[0].y] = x(d[0].y);
                var sel = d3.select(this);
                sel.moveToFront();
            }
        })
        .on("drag", function(d, i) {
            if (trigger == "labels") {
                d3.selectAll(".cellrow").attr("opacity", 0);
                dragging[d[0].y] = Math.min(dimensions.w_width, Math.max(0, d3.event.x));
                top_orders.id.sort(function(a, b) { return cPosition(a) - cPosition(b); });
                x.domain(top_orders.id);
                d3.selectAll(".column").attr("transform", function(d) { 
                    if(d)
                        return "translate(" + cPosition(d[0].y) + ")rotate(-90)"; 
                });
            }

        })
        .on("dragend", function(d, i) {
            delete dragging[d[0].y];
            transition(d3.select(this)).attr("transform", "translate(" + x(d[0].y) + ")rotate(-90)");
            d3.selectAll(".row").each(function(d, i) {
                d3.select(this).selectAll(".cellrow").attr("x", function(d) { 
                    return x(d.y);
                });
            });
            [endX, endY] = d3.mouse(this);
            if(Math.abs(startX-endX) > 0) {
                updateMatrixAndRedraw(data, top_orders.id, 'top');
            }
        })
    );

    column.append("rect").attr("width", function(d, i) {return 8* t_nodes[i].name.length;})
        .attr("height","20px")
        .attr("x", function(d, i) {return -t_nodes[i].name.length -5;})
        .attr("y", "-10px")
        .attr("opacity", function(d, i){
            if (sel_topics.indexOf(t_nodes[i].name) > -1) {
                return 1;
            }else{
                return 0;
            }
        });
    column.append("text")
        .attr("class", "labels")
        .attr("x", -10)
        .attr("y", 0)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text(function(d, i) { return t_nodes[i].name; })
        .attr("fill", function(d, i){
            if (sel_topics.indexOf(t_nodes[i].name) > -1) {
                return "#fff";
            }
        })
        .style("font-weight", function(d, i){
            if (sel_topics.indexOf(t_nodes[i].name) > -1) {
                return "bolder";
            }
        });
    column.append("text")
        .attr("class","sorter")
        .attr("x", function(d, i) {return 6* t_nodes[i].name.length;})
        .attr("dy", ".32em")
        .text("<--|")
        .attr("id", function(d, i) { return t_nodes[i].name; })   //Fix added by Pranay on 19-Nov-2018 for incorrect topic view issue

    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };
}

function row_fn(row) {
    var cell = d3.select(this).selectAll(".cellrow")
        .data(row.filter(function(d) {
            return d.z;
        }))
        .enter().append("circle")
        .attr("pos_id", function(d){return "pos_"+d.x+"_"+d.y;})
        .attr("class", "cellrow")
        .attr("cx", function(d) {
            if(x(d.y))
                return x(d.y);
        })
        .attr("fill", "#000")
        .style("r", function(d, i) {
            return d.z;
        });
}

function column_fn(column) {
    var cell = d3.select(this).selectAll(".cellcolumn")
        .data(column.filter(function(d) {
            return d.z;
        }))
        .enter().append("circle")
        .attr("pos_id", function(d){return "pos_"+d.x+"_"+d.y;})
        .attr("class", "cellcolumn")
        .attr("cx", function(d) {
            return -y(d.x);
        })
        .attr("fill", "#000")
        .style("r", function(d,i,j) { 
            return d.z;
        });
}

function gbox_fn(gbox, j) {
    var g = d3.select(this).selectAll(".gboxbox")
        .data(gbox)
        .enter().append("rect")
        .attr("class", "gboxbox")
        .attr("y", function(d, i){
            return y(i);
        })
        .attr("row_id", function(d, i){
            return "grd_row_"+i;
        })
        .attr("col_id", function(d, i){
            return "grd_col_"+j;
        })
        .style("fill", "#aaa0")
        .style("height", dimensions.grid_size*0.9)
        .style("width", dimensions.grid_size*0.93)
        .on("mouseout", function(d){
            var rid = d3.select(this).attr("row_id").split("grd_row_")[1];
            var cid = d3.select(this.parentNode).attr("col_id").split("grd_col_")[1]
            d3.selectAll("[row_id=grd_row_"+rid+"]").style("fill", "#aaa0");
            d3.selectAll("[col_id=grd_col_"+cid+"]").style("fill", "#aaa0");
        })
        .on("mouseover", function(d){
            var rid = d3.select(this).attr("row_id").split("grd_row_")[1];
            var cid = d3.select(this.parentNode).attr("col_id").split("grd_col_")[1]
            d3.selectAll("[row_id=grd_row_"+rid+"]").style("fill", "#aaa5");
            d3.selectAll("[col_id=grd_col_"+cid+"]").style("fill", "#aaa5");
        });
}

function position(d) {
    var v = dragging[d];
    return v == null ? y(d) : v;
}

function cPosition(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}


function updateMatrixAndRedraw(data, orders, dimension){
    // console.log("dimension is: ", dimension);
    var tempweights = data["weights"];
    var temptopicids = data["topicids"];
    var tempdocids = data["docids"];

    // console.log("data before:", data);
    // console.log("temp before:", temp);
    if(dimension == 'top'){
        // console.log("top orders", top_orders);
        for(var i=0; i<tempweights.length; i++){
            tempweights[i] = togetherSort(tempweights[i], orders);
        }
        // console.log("n top_orders", top_orders);
        // console.log("b4 topids", temptopicids);
        temptopicids = togetherSort(temptopicids, orders);
        // console.log("after topids", temptopicids);
    }
    if(dimension == 'left'){
        // console.log("doc orders", doc_orders);
        tempweights = togetherSort(tempweights, orders);
        tempdocids = togetherSort(tempdocids, orders);
    }
    // console.log("data after:", data);
    // console.log("temp after:", temp);
    var temp = {
        topicids: temptopicids,
        docids: tempdocids,
        weights: tempweights
    }

    // Timeout just to let the animation settle
    setTimeout(function(){
        draw_matrix(temp);
        // uncomment to test out animation
        // sort_animate(doc_orders.name, "document");
        // sort_animate(top_orders.name, "topic");
    }, 500);

}

function togetherSort(array, orders){
    if(array.length != orders.length){
        console.log("array and orders dims dont match!", array.length, orders.length);
        return;
    }
    //1) combine the arrays:
    // var list = [];
    // for (var j = 0; j < array.length; j++)
    //     list.push({'item': array[j], 'id': orders[j]});

    // console.log("mash b4 sort:", list);
    // //2) sort:
    // list.sort(function(a, b) {
    //     return a.id - b.id;
    // });
    // console.log("mash after sort:", list);
    // //3) separate them back out:
    // for (var k = 0; k < list.length; k++) {
    //     array[k] = list[k].item;
    // }
    var n_array = [];
    for(var i=0; i<orders.length; i++){
        n_array.push(array[orders[i]]);
    }
    return n_array;
}

function sort_animate(orders, dimension){
    if(dimension == "topic"){
        for(var i=0;i<orders.length;i++){
            d3.select("[col_id=col_" + i +"]")
                .transition().duration(500)
                .attr("transform", function(d) {return "translate(" + (x(orders.indexOf(i))) + ", 0)rotate(-90)"})
        }
    }
    if(dimension == "document"){
        for(var i=0;i<orders.length;i++){
            d3.select("[row_id=row_" + i +"]")
                .transition().duration(500)
                .attr("transform", function(d) {return "translate(0, " + (y(orders.indexOf(i))) + ")"})
        }
    }

}
function scale_radius(r, min, max){
    var rad = ((r-min)/(max-min)) * 8;
    if(rad > 10){
        rad = 10;
    }
    return rad
}


export function render_matrix(props){
    globalfns = props;
    read_data();
    return this;
}

var oldProps = {
    sort_controls: {order:"none", selection: "none"},
    doc_sort_controls: {order:"none", selection: "none"}
};

export function sort(props){
    console.log("sort called", oldProps, props);
    if(props.sort_controls.order !== oldProps.sort_controls.order || props.sort_controls.selection !== oldProps.sort_controls.selection) {
        console.log("inside topic control block");
        d3.selectAll(".cellrow").attr("opacity", 0);
        d3.selectAll(".cellcolumn").attr("opacity", 1);
        var orders = top_orders.id;

        var sel_topids = [];
        for (var i = 0; i < sel_topics.length; i++) {
            var idx = top_nodes.indexOf(sel_topics[i]);
            if (idx >= -1) {
                sel_topids.push(idx);
            }
        }

        //sort contorls
        if (props.sort_controls.order === "max") {
            let maxs = top_matrix.map((item) => {
                return d3.max(item)
            });
            orders = d3.range(maxs.length).sort(function (a, b) {
                return maxs[b].z - maxs[a].z
            });
        } else if (props.sort_controls.order === "min") {
            let mins = top_matrix.map((item) => {
                return d3.min(item)
            });
            orders = d3.range(mins.length).sort(function (a, b) {
                return mins[b].z - mins[a].z
            });
        } else if (props.sort_controls.order === "mean") {
            let means = top_matrix.map((item) => {
                return d3.mean(item, (d) => {
                    return d.z
                })
            });
            orders = d3.range(means.length).sort(function (a, b) {
                return means[b] - means[a]
            });
        } else if (props.sort_controls.selection === "bringleft") {
            orders = d3.range(t_cnt).filter(function (d) {
                return sel_topids.indexOf(d) == -1;
            });
            orders = sel_topids.concat(orders);
        }

        // update data only if view has changed
        sort_animate(orders, "topic");
        for (var i = 0; i < orders.length; ++i) {
            if (orders[i] !== top_orders.id[i]) {
                updateMatrixAndRedraw(new_data, orders, "top");
                break;
            }
        }

        orders = doc_orders.id;
        if (props.sort_controls.selection === "sort") {
            d3.selectAll(".cellrow").attr("opacity", 1);
            d3.selectAll(".cellcolumn").attr("opacity", 0);
            var sums = []
            for (var i = 0; i < top_matrix[0].length; i++) {
                var sum = 0;
                for (var j = 0; j < sel_topics.length; j++) {
                    sum += top_matrix[sel_topids[j]][i].z;
                }
                sums.push(sum);
            }
            orders = d3.range(sums.length).sort(function (a, b) {
                return sums[b] - sums[a];
            })
        } else if (props.sort_controls.selection === "clear") {
            sel_topics = [];
            document.getElementById('selectedtopicslist').innerHTML = "No Topics Selected";
            updateMatrixAndRedraw(new_data, orders, "left");
        }
        // update data only if view has changed
        //selection controls
        sort_animate(orders, "document");
        for (var i = 0; i < orders.length; i++) {
            if (orders[i] !== doc_orders.id[i]) {
                updateMatrixAndRedraw(new_data, orders, "left");
                break;
            }
        }
    }

    if(props.doc_sort_controls.order !== oldProps.doc_sort_controls.order || props.doc_sort_controls.selection !== oldProps.doc_sort_controls.selection) {
        //documents related sorting
        console.log("inside document control block");
        d3.selectAll(".cellrow").attr("opacity", 1);
        d3.selectAll(".cellcolumn").attr("opacity", 0);
        var orders = doc_orders.id;

        var sel_docids = [];
        for (var i = 0; i < sel_docs.length; i++) {
            var idx = doc_nodes.indexOf(sel_docs[i]);
            if (idx >= -1) {
                sel_docids.push(idx);
            }
        }

        var temp_doc_nodes = [];
        var sortordertype = props.doc_sort_controls.order;
        if (sortordertype === "file") {
            temp_doc_nodes = matrix_data["docids"];
        }else if(sortordertype === "id"){
            temp_doc_nodes = []
            for(var i=0; i<matrix_data["docids"].length; i++){
                temp_doc_nodes.push("ID:    "+i);
            }
        }else if(sortordertype === "auto"){
            temp_doc_nodes = []
            for(var i=0; i<matrix_data["docids"].length; i++){
                temp_doc_nodes.push("document "+i);
            }
        }else if(sortordertype === "sortfile"){
            orders = doc_orders.name;
        }else if(sortordertype === "sortid"){
            orders = doc_orders.id;
        }

        var sortselectiontype = props.doc_sort_controls.selection;
        if(sortselectiontype === "sortdoc"){
            var sums = [];
            for (var i = 0; i < doc_matrix[0].length; i++) {
                var sum = 0;
                for (var j = 0; j < sel_docs.length; j++) {
                    sum += doc_matrix[sel_docids[j]][i].z;
                }
                sums.push(sum);
            }
            orders = d3.range(sums.length).sort(function (a, b) {
                return sums[b] - sums[a];
            });
            console.log("sortdoc order is ", doc_orders.id);
        }else if(sortselectiontype === "movedoc"){
            orders = d3.range(d_cnt).filter(function (d) {
                return sel_docids.indexOf(d) == -1;
            });
            orders = sel_docids.concat(orders);
        }else if(sortselectiontype === "cleardoc"){
            sel_docs = [];
            document.getElementById('selecteddocslist').innerHTML = "No Document Selected";
        }

        if(sortordertype === "file" || sortordertype === "id" || sortordertype === "auto"){
            d3.selectAll(".cellrow").attr("opacity", 1);
            d3.selectAll(".cellcolumn").attr("opacity", 0);
            new_data.docids = temp_doc_nodes;
            sel_docs = [];
            document.getElementById('selecteddocslist').innerHTML = "No Document Selected";
            updateMatrixAndRedraw(new_data, orders, "left");
        }
        if(sortselectiontype === "sortdoc"){
            d3.selectAll(".cellrow").attr("opacity", 0);
            d3.selectAll(".cellcolumn").attr("opacity", 1);
            sort_animate(orders, "topic");
            for (var i = 0; i < orders.length; i++) {
                if (orders[i] !== top_orders.id[i]) {
                    updateMatrixAndRedraw(new_data, orders, "top");
                    break;
                }
            }
        }else{
            d3.selectAll(".cellrow").attr("opacity", 1);
            d3.selectAll(".cellcolumn").attr("opacity", 0);
            sort_animate(orders, "document");
            updateMatrixAndRedraw(new_data, orders, "left");
        }

    }
    oldProps = props;
}
// export function sort_matrix(type){
//     console.log(doc_orders);
//     sort_animate(doc_orders.id, "document");
// }