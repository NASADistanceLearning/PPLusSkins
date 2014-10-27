<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/">
		<xsl:for-each select="//CHAPTER">
			<xsl:element name="div">
			<xsl:attribute name="class">r2RowChapter</xsl:attribute>
				<xsl:element name="a">
					<xsl:attribute name="title"><xsl:value-of select="concat(CHAPTERTIME,' - ',CHAPTERTITLE)"/></xsl:attribute>
					<xsl:attribute name="onclick"><xsl:value-of select="concat('window.top.video.seek(&quot;',CHAPTERTIME,'&quot;); return true;')"/></xsl:attribute>
					<xsl:attribute name="href">#</xsl:attribute>
					<xsl:value-of select="CHAPTERTITLE"/>
				</xsl:element>
			</xsl:element>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>



