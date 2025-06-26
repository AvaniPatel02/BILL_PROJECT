
  // const handleGeneratePDF = async () => {
  //   setIsGeneratingPDF(true);
  //   await new Promise((resolve) => setTimeout(resolve, 100));

  //   const element = tableRef.current;
  //   element.style.backgroundColor = "#fff";

  //   const canvas = await html2canvas(element, {
  //     scale: 2,
  //     backgroundColor: "#fff",
  //     useCORS: true,
  //   });

  //   const pdf = new jsPDF("p", "mm", "a5");
  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const margin = 10;
  //   const pdfWidth = pageWidth - margin * 2;
  //   const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  //   pdf.addImage(
  //     canvas.toDataURL("image/png"),
  //     "PNG",
  //     margin,
  //     margin,
  //     pdfWidth,
  //     pdfHeight
  //   );

  //   pdf.save(`Statement-${buyer_name}.pdf`);
  //   setIsGeneratingPDF(false);
  // };
