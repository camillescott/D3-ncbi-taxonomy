% Camille Welcher
% February 7, 2016

# Project Proposal
## Introduction

As next-generation sequences technology has become increasingly cheap and accessible, many labs are opting to use sequencing technology for their projects. For groups looking to quickly and cheaply produce a working profile of genes in an organism, RNA-seq has become a favored method. An RNA-seq experiment produces hundreds of millions of short sequence fragments, "reads," from the transcribed RNA of an organism. These reads are then assembled into transcripts, full length sequences which represent full genes. These transcripts would eventually be translated into proteins, meaning that their sequence content and abundances are valuable to the understanding of the function of an organism. Characterizing a set of transcripts, or a "transcriptome," is a continuing field of research: actually assembling the reads into full length transcripts, estimating the expression level of those transcripts, and annotating them by identifying the names, structure, and function of those transcripts being major topics. While significant progress has been made in all these pursuits, a key item missing is the ability to rapidly summarize and compare entire transcriptomes. With many studies being published every day with newly assembled and annotated transcriptomes, this absence becomes increasingly clear.

I propose a method to easily compare the quality of annotations, and less directly the quality of assembly, of transcriptomes. This method will combine established techniques from phylogenetics with known visualization methods. The result will be a method to produce easily digestible visual and quantitative summaries of assembled transcriptomes.

## Visualization Method

The main visualization produced from this technique will use existing phylogenetic trees to help researchers assess their transcriptomes. The most direct method will map gene annotation identifiers onto their nodes in a known taxonomy, provided by the NCBI or another another curated source. A partition map can then be built showing the the number of annotations in each subgroup; if many clades unrelated to the origin species are over represented, that suggests contamination or an otherwise poor annotation. A mockup of such a chart is shown in Figure 1.
