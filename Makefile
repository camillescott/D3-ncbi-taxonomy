project-proposal.pdf: project-proposal.md proposal.bib
	pandoc -f markdown+fenced_code_blocks+fenced_code_attributes+tex_math_dollars+implicit_figures --bibliography proposal.bib  --filter pandoc-citeproc $< -o $@
