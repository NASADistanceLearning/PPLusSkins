<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="PRESENTATION">
		<xsl:for-each select="//EVENT">
			<xsl:sort select="EVENTSTIME" data-type="number"/>
			<xsl:element name="div">
			<xsl:attribute name="class">thumbox</xsl:attribute>
			<xsl:attribute name="style">style="display:inline"</xsl:attribute>
				<xsl:element name="a">
					<xsl:attribute name="title"><xsl:value-of select="concat('Slide #', position())"/></xsl:attribute>
					<xsl:attribute name="class">seek</xsl:attribute>
					<xsl:attribute name="onclick"><xsl:value-of select="concat('seek(GetTimeFromLong(&quot;',EVENTSTIME,'&quot;)); return true;')"/></xsl:attribute>
					<xsl:attribute name="href">#</xsl:attribute>
					<xsl:element name="img">
						<xsl:attribute name="alt"><xsl:value-of select="concat('Slide #', position())"/></xsl:attribute>
						<xsl:attribute name="border">0</xsl:attribute>
						<xsl:attribute name="src">
							<xsl:choose>
								<xsl:when test="(EVENTSTYPE = 'URL')">th_webdoc.jpg</xsl:when>
								<xsl:when test="(substring-after(EVENTSIMG,'.') = 'swf')">th_flashdoc.jpg</xsl:when>
								<xsl:otherwise><xsl:value-of select="EVENTSIMGSML"/></xsl:otherwise>
							</xsl:choose>
						</xsl:attribute>
					</xsl:element>
				</xsl:element>
			</xsl:element>
		</xsl:for-each>
	</xsl:template>
</xsl:stylesheet>