var parser = require("biojs-io-newick");

var diameter = 1000;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([360, diameter / 2 - 120])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .style("border-style", "solid")
    .style("border-width", "5px")
    .call(d3.behavior.zoom().on("zoom", function () {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")}))
    .append("g")
    .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

// Javascript's included mod is stupid
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Remove elements from the end of A and put them on B
function array_transfer(A, B, n) {
    if (typeof(n) === 'undefined') n = 0;
    A.splice(-Math.abs(n)).forEach(function (e) { B.push(e); });
}

function expand_children(d, n) {
    if (d._children) {
        if(!d.children) d.children = new Array();
        array_transfer(d._children, d.children, n);
        if (d._children.length == 0) d._children = null;
    }
}

function collapse_children(d, n) {
    if (d.children) {
        if (!d._children) d._children = new Array();
        array_transfer(d.children, d._children, n);
        if (d.children.length == 0) d.children = null;
    }
}

function swap_children(d) {
    if (d.children) {
        collapse_children(d);
    } else {
        expand_children(d);
    }
}

function get_left_sibling(d) {
    if (d.parent) {
        return d.parent.children[mod(d.parent.children.indexOf(d) - 1, d.parent.children.length)];
    }
    return d;
}

function get_right_sibling(d) {
    if (d.parent) {
        return d.parent.children[mod(d.parent.children.indexOf(d) + 1, d.parent.children.length)];
    }
    return d;
}

function get_middle_child(d) {
    if (d.children) {
        return d.children[Math.round(d.children.length / 2)];
    }
    return d;
}

// Reroot the tree at the given node
// We'll refer to this new root as the "virtual root"
function reroot_tree(new_root) {
    if (new_root.is_virtual_root) {
        return;
    }
    root.is_virtual_root = false;
    new_root.is_virtual_root = true;
    root = new_root;
    var seenset = new Set();
    seenset.add(root);
    
    // To do the reroot, we swap child and parent nodes until we reach the old "top" of the tree
    function do_reroot(d) {
        if (d.parent && !(seenset.has(d))) {
            // Do it for the parent node
            seenset.add(d);
            if (d.parent) do_reroot(d.parent);
            // Make d's current parent one of its children
            d.children.push(d.parent);

            // Now we need to remove d from the parent's child list
            // Need to check children and _children
            d_index = d.parent.children.indexOf(d);
            if (d_index == -1) {
                d_index = d.parent._children.indexOf(d);
                d.parent._children.splice(d_index, 1);
            } else {
                d.parent.children.splice(d_index, 1);
            }
            // Now make d the parent's parent
            d.parent.parent = d;

            //if (d.parent.children) d.parent.children.forEach(do_reroot);
            //if (d.parent._children) d.parent._children.forEach(do_reroot);
        }
    }
    do_reroot(root.parent);
}

// Grab the NCBI data from the static dir
d3.text("{{ url_for('static', filename='ncbi.nwk') }}", function(error, ncbi_nwk) {
    if (error) throw error;

    // Use the biojs newick parser to convert it to JSON from plain text
    // NOTE: root is global
    root = parser.parse_newick(ncbi_nwk);
    root.is_root = true;
    root.is_virtual_root = true;
    selected_node = root;

    // Recursively count total descendant nodes for each node
    // We'll use this for the node size calculation
    function count(d) {
        if (d.children) {
            d.n_children = d3.sum(d.children.map(count));
            return d.n_children;
        } else {
            d.n_children = 0;
            return 1;
        }
    }

    // Collapse all nodes by default
    // Collapsed nodes are scored as _children, active as children
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    // Apply the counting function
    count(root);
    root.children.forEach(function (d) { if(d.children) d.children.forEach(collapse) ; } );
    // Start the update cycle
    update(root);
});

//d3.select(self.frameElement).style("height", "800px");

function update(source) {

    var nodes = tree.nodes(root),
        links = tree.links(nodes);

    // Compute node size based on number of children.
    function nodeSizeFunc(d) {
        if (d.is_root) {
            return 15.0;
        } else if (d._children) {
            return 15.0 * (d.n_children / (d.n_children + 50));
        } else if (d.children) {
            return 15.0 * (d.n_children / (d.n_children + 100));
        } else {
            return 5.0;
        }
    }

    // Color the nodes. For now we just color the root node red.
    function nodeColorFunc(d) {
        if (d == selected_node) {
            return {"fill": "yellowgreen", "stroke": "green", "stroke-width": "2px"};
        } else if (d.is_root) {
            return {"fill": "lightcoral", "stroke": "red", "stroke-width": "1.5px"};
        } else if (d.children) {
            return {"fill": "#fff", "stroke": "steelblue", "stroke-width": "1.5px"};
        } else if (d.n_children == 0) {
            return {"fill": "mediumpurple", "stroke": "purple", "stroke-width": "1.5px"};
        } else {
            return {"fill": "lightsteelblue", "stroke": "steelblue", "stroke-width": "1.5px"};
        }
    }

    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";})
        .on("click", click);


    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeEnter.append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
      .text(function(d) { return d.is_root ? "" : d.name; });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

    nodeUpdate.select("circle")
        .attr("r", nodeSizeFunc)
        .each(function (d) {
            d3.select(this).style(
                nodeColorFunc(d)
            );
        });

        //.style("fill", nodeColorFunc);

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "rotate(" + (source.x-90) + "," + source.y + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
    .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function click(d) {
    selected_node = d;
    update(d);
}

d3.select("body").on("keydown", function() {
    key = d3.event.keyCode;
    // "a"
    if (key == 65) {
        selected_node = get_left_sibling(selected_node);
    }
    // "d"
    if (key == 68) {
        selected_node = get_right_sibling(selected_node);
    }
    // "w"
    if (key == 87) {
        if (selected_node != root) {
            selected_node = selected_node.parent;
        }
    }
    // "s"
    if (key == 83) {
        selected_node = get_middle_child(selected_node);
    }
    // right arrow
    if (key == 39) {
        expand_children(selected_node, 10);
    // left arrow
    } 
    if (key == 37) {
        collapse_children(selected_node, 10);
    // up arrow
    } 
    if (key == 38) {
        expand_children(selected_node);
    // down arrow
    } 
    if (key == 40) {
        collapse_children(selected_node);
    }
    update(selected_node);
});

