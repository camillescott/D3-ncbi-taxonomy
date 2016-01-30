from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route("/")
def ctree1():
    return render_template("collapsible-tree.html")


@app.route("/ctree2/")
def ctree2():
    return render_template("collapsible-tree-2.html")


@app.route("/cctree/")
def cctree():
    return render_template("collapsible-circular.html")

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
