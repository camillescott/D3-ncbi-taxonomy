project-proposal.pdf: project-proposal.md
	pandoc -f markdown+fenced_code_blocks+fenced_code_attributes+tex_math_dollars $< -o $@
